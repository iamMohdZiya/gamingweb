import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import './TicTacToe.css';

const TicTacToe = ({ gameId, opponent, onGameEnd }) => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [winner, setWinner] = useState(null);
    const { socket } = useChat();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    useEffect(() => {
        if (!socket) return;

        socket.on('game_move', ({ gameId: receivedGameId, position, player }) => {
            if (receivedGameId === gameId) {
                setBoard(prev => {
                    const newBoard = [...prev];
                    newBoard[position] = player === currentUser._id ? 'X' : 'O';
                    return newBoard;
                });
                setIsMyTurn(player !== currentUser._id);
            }
        });

        socket.on('game_start', ({ gameId: receivedGameId, startingPlayer }) => {
            if (receivedGameId === gameId) {
                setBoard(Array(9).fill(null)); // Reset board
                setWinner(null); // Reset winner
                setIsMyTurn(startingPlayer === currentUser._id);
            }
        });
        
        socket.on('game_over', ({ gameId: receivedGameId, winner: gameWinner, isDraw }) => {
            if (receivedGameId === gameId) {
                if (isDraw) {
                    setWinner('draw');
                } else if (gameWinner) {
                    setWinner(gameWinner);
                }
            }
        });
        
        socket.on('opponent_disconnected', ({ gameId: receivedGameId }) => {
            if (receivedGameId === gameId) {
                alert('Your opponent has disconnected. You win by default!');
                setWinner(currentUser._id); // Set current user as winner
            }
        });

        return () => {
            socket.off('game_move');
            socket.off('game_start');
            socket.off('game_over');
            socket.off('opponent_disconnected');
        };
    }, [socket, gameId, currentUser._id, opponent]);

    useEffect(() => {
        checkWinner();
    }, [board]);

    const checkWinner = () => {
        for (let combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                setWinner(board[a] === 'X' ? currentUser._id : opponent);
                return;
            }
        }

        // Check for draw
        if (board.every(cell => cell !== null)) {
            setWinner('draw');
        }
    };

    const handleClick = (position) => {
        if (!isMyTurn || board[position] || winner) return;

        socket.emit('game_move', {
            gameId,
            position,
            player: currentUser._id,
            opponent
        });
    };

    const renderCell = (position) => {
        return (
            <div 
                className={`cell ${board[position] ? 'filled' : ''} ${isMyTurn && !board[position] ? 'clickable' : ''}`}
                onClick={() => handleClick(position)}
            >
                {board[position]}
            </div>
        );
    };

    return (
        <div className="tictactoe-container">
            <div className="game-status">
                {winner ? (
                    <div className="winner-message">
                        {winner === 'draw' 
                            ? "It's a draw!" 
                            : `${winner === currentUser._id ? 'You won!' : 'Opponent won!'}`}
                    </div>
                ) : (
                    <div className="turn-message">
                        {isMyTurn ? 'Your turn' : "Opponent's turn"}
                    </div>
                )}
            </div>
            <div className="board">
                <div className="row">
                    {renderCell(0)}
                    {renderCell(1)}
                    {renderCell(2)}
                </div>
                <div className="row">
                    {renderCell(3)}
                    {renderCell(4)}
                    {renderCell(5)}
                </div>
                <div className="row">
                    {renderCell(6)}
                    {renderCell(7)}
                    {renderCell(8)}
                </div>
            </div>
            {winner && (
                <button className="play-again" onClick={onGameEnd}>
                    Close Game
                </button>
            )}
        </div>
    );
};

export default TicTacToe;
