import { useState, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import './GameInvite.css';

const GameInvite = ({ friend, onGameStart }) => {
    const [showInvite, setShowInvite] = useState(false);
    const [pendingInvite, setPendingInvite] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30);
    const { socket } = useChat();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const [gameRequests, setGameRequests] = useState([]);
    
    // Reference to store the current interval
    const [inviteInterval, setInviteInterval] = useState(null);
    
    // Define declineInvite function with useCallback
    const declineInvite = useCallback(() => {
        if (!pendingInvite) return;
        
        socket.emit('game_invite_declined', {
            from: pendingInvite.from,
            to: currentUser._id
        });
        
        setShowInvite(false);
        setPendingInvite(false);
    }, [pendingInvite, socket, currentUser._id]);

    useEffect(() => {
        if (!socket) return;

        const fetchGameRequests = async () => {
            try {
                const response = await fetch('/user/game-requests');
                const data = await response.json();
                setGameRequests(data);
            } catch (error) {
                console.error('Error fetching game requests:', error);
            }
        };
        
        fetchGameRequests();

        const handleGameInvite = ({ gameId, from, to, expiresAt }) => {
            if (to === currentUser._id) {
                setShowInvite(true);
                setPendingInvite({ gameId, from });
                
                // Calculate time left for invitation
                const timeLeftMs = expiresAt - Date.now();
                const timeLeftSeconds = Math.max(1, Math.floor(timeLeftMs / 1000));
                setTimeLeft(timeLeftSeconds);
                
                // Clear any existing interval
                if (inviteInterval) {
                    clearInterval(inviteInterval);
                }
                
                // Start countdown
                const interval = setInterval(() => {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            setInviteInterval(null);
                            // Auto-decline after timeout
                            if (pendingInvite) {
                                declineInvite();
                            }
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                
                // Store the interval reference
                setInviteInterval(interval);
            }
        };
        
        socket.on('game_invite', handleGameInvite);
        socket.on('game_invite_accepted', ({ gameId, from, to }) => {
            if (from === currentUser._id) {
                onGameStart(gameId, to);
            }
            fetchGameRequests();
        });

        socket.on('game_invite_declined', ({ from, to }) => {
            if (from === currentUser._id) {
                setPendingInvite(false);
                alert('Game invitation was declined');
            }
            fetchGameRequests();
        });
        
        socket.on('updateGameRequests', fetchGameRequests);

        return () => {
            socket.off('game_invite', handleGameInvite);
            socket.off('game_invite_accepted');
            socket.off('game_invite_declined');
            socket.off('updateGameRequests');
        };
    }, [socket, currentUser._id, onGameStart, inviteInterval, pendingInvite, declineInvite]);
    
    // Cleanup for the invitation countdown interval
    useEffect(() => {
        return () => {
            if (inviteInterval) clearInterval(inviteInterval);
        };
    }, [inviteInterval]);
    
    const sendInvite = async () => {
        const gameId = `game_${Date.now()}`;
        const expiresAt = Date.now() + 30000; // 30 seconds from now
        
        try {
            socket.emit('game_invite', {
                gameId,
                from: currentUser._id,
                to: friend._id,
                expiresAt
            });
        } catch (error) {
            console.error('Error sending game invite:', error);
        }
        
        setPendingInvite({ gameId, to: friend._id });
        setTimeLeft(30);
        
        // Clear any existing interval
        if (inviteInterval) {
            clearInterval(inviteInterval);
            setInviteInterval(null);
        }
        
        // Start countdown
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setPendingInvite(null);
                    setInviteInterval(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        // Store the interval reference
        setInviteInterval(interval);
    };

    const acceptInvite = () => {
        if (!pendingInvite) return;
        
        socket.emit('game_invite_accepted', {
            gameId: pendingInvite.gameId,
            from: pendingInvite.from,
            to: currentUser._id
        });
        
        onGameStart(pendingInvite.gameId, pendingInvite.from);
        setShowInvite(false);
        setPendingInvite(false);
    };

    // declineInvite function is now defined with useCallback above

    return (
        <div className="game-invite">
            {showInvite ? (
                <div className="invite-popup">
                    <div className="invite-header">
                        <i className="fas fa-gamepad"></i>
                        <h3>Game Challenge!</h3>
                    </div>
                    <p>{friend.name} invites you to play Tic-tac-toe</p>
                    <div className="timer">
                        <div className="timer-circle">
                            <span>{timeLeft}s</span>
                        </div>
                    </div>
                    <div className="invite-actions">
                        <button className="accept-btn" onClick={acceptInvite}>
                            <i className="fas fa-check"></i> Accept
                        </button>
                        <button className="decline-btn" onClick={declineInvite}>
                            <i className="fas fa-times"></i> Decline
                        </button>
                    </div>
                </div>
            ) : (
                <button 
                    className={`challenge-btn ${pendingInvite ? 'pending' : ''}`}
                    onClick={sendInvite}
                    disabled={pendingInvite}
                >
                    {pendingInvite ? (
                        <>
                            <div className="invite-pending">
                                <i className="fas fa-clock"></i>
                                <span>Waiting ({timeLeft}s)</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-gamepad"></i>
                            <span>Challenge to Play</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
};

export default GameInvite;
