const handleGameSocket = (io, socket) => {
    // Store active games
    const activeGames = new Map();
    
    socket.on('game_invite', async ({ gameId, from, to, expiresAt }) => {
        try {
            // Update receiver's gameRequests array
            const User = require('../model/user');
            await User.findByIdAndUpdate(to, {
                $push: {
                    gameRequests: {
                        from: from,
                        status: 'PENDING',
                        sentAt: new Date()
                    }
                }
            });
            
            // Get receiver's socket ID
            const receiverSocketId = Array.from(io.sockets.sockets.values())
                .find(s => s.userId === to)?.id;
                
            if (receiverSocketId) {
                // Send game invitation to the opponent
                io.to(receiverSocketId).emit('receiveGameInvite', { 
                    gameId, 
                    from, 
                    expiresAt,
                    status: 'PENDING'
                });
            }
        } catch (error) {
            console.error('Error sending game invite:', error);
        }
    });
    
    socket.on('game_invite_accepted', async ({ gameId, from, to }) => {
        try {
            const User = require('../model/user');
            // Update game request status
            await User.findByIdAndUpdate(to, {
                $set: {
                    'gameRequests.$[elem].status': 'ACCEPTED'
                }
            }, {
                arrayFilters: [{
                    'elem.from': from,
                    'elem.status': 'PENDING'
                }]
            });
            
            // Randomly decide who starts
            const startingPlayer = Math.random() < 0.5 ? from : to;
            
            // Create a new game room
            const roomId = `game_${gameId}`;
            
            // Get both players' socket IDs
            const fromSocketId = Array.from(io.sockets.sockets.values())
                .find(s => s.userId === from)?.id;
            const toSocketId = Array.from(io.sockets.sockets.values())
                .find(s => s.userId === to)?.id;
                
            // Join both players to the game room
            if (fromSocketId) io.sockets.sockets.get(fromSocketId)?.join(roomId);
            if (toSocketId) io.sockets.sockets.get(toSocketId)?.join(roomId);
            
            // Store game state
            activeGames.set(gameId, {
                players: [from, to],
                board: Array(9).fill(null),
                currentTurn: startingPlayer,
                roomId
            });
            
            // Notify the opponent that the invitation was accepted
            if (fromSocketId) {
                io.to(fromSocketId).emit('game_invite_accepted', { gameId, from, to });
            }
            
            // Start the game for both players
            io.to(roomId).emit('game_start', { gameId, startingPlayer });
            
            // Emit event to update both clients
            io.to(fromSocketId).emit('updateGameRequests');
            io.to(toSocketId).emit('updateGameRequests');
        } catch (error) {
            console.error('Error accepting game invite:', error);
        }
    });

    socket.on('game_invite_declined', async ({ from, to }) => {
        try {
            const User = require('../model/user');
            // Update game request status
            await User.findByIdAndUpdate(to, {
                $set: {
                    'gameRequests.$[elem].status': 'DECLINED'
                }
            }, {
                arrayFilters: [{
                    'elem.from': from,
                    'elem.status': 'PENDING'
                }]
            });
            
            // Get challenger's socket ID
            const fromSocketId = Array.from(io.sockets.sockets.values())
                .find(s => s.userId === from)?.id;
                
            // Notify the challenger that the invitation was declined
            if (fromSocketId) {
                io.to(fromSocketId).emit('game_invite_declined', { from, to });
            }
            
            // Emit event to update both clients
            io.to(fromSocketId).emit('updateGameRequests');
            io.to(toSocketId).emit('updateGameRequests');
        } catch (error) {
            console.error('Error declining game invite:', error);
        }
    });

    socket.on('game_move', ({ gameId, position, player, opponent }) => {
        // Get the game state
        const game = activeGames.get(gameId);
        
        if (!game) return;
        
        // Validate the move
        if (game.currentTurn !== player || game.board[position] !== null) {
            return;
        }
        
        // Update the game state
        game.board[position] = player;
        game.currentTurn = opponent;
        
        // Broadcast the move to the game room
        io.to(game.roomId).emit('game_move', { gameId, position, player });
        
        // Check for win or draw
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        let winner = null;
        
        // Check for winner
        for (const combo of winningCombinations) {
            const [a, b, c] = combo;
            if (game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c]) {
                winner = game.board[a];
                break;
            }
        }
        
        // Check for draw
        const isDraw = !winner && game.board.every(cell => cell !== null);
        
        if (winner || isDraw) {
            // Emit game over event
            io.to(game.roomId).emit('game_over', { 
                gameId, 
                winner, 
                isDraw,
                board: game.board 
            });
            
            // Clean up the game
            activeGames.delete(gameId);
        }
    });
    
    // Handle player disconnect during game
    socket.on('disconnect', () => {
        // Find games where this player is participating
        for (const [gameId, game] of activeGames.entries()) {
            if (game.players.includes(socket.userId)) {
                // Get the opponent
                const opponent = game.players.find(id => id !== socket.userId);
                
                // Notify the opponent that the player disconnected
                if (opponent) {
                    const opponentSocketId = Array.from(io.sockets.sockets.values())
                        .find(s => s.userId === opponent)?.id;
                        
                    if (opponentSocketId) {
                        io.to(opponentSocketId).emit('opponent_disconnected', { gameId });
                    }
                }
                
                // Clean up the game
                activeGames.delete(gameId);
            }
        }
    });
};

module.exports = handleGameSocket;
