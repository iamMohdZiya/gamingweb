import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import GameInvite from './GameInvite';
import TicTacToe from './TicTacToe';
import ChatBox from './ChatBox';
import './GamesPage.css';

const GamesPage = () => {
    const [activeGame, setActiveGame] = useState(null);
    const [pendingOutgoing, setPendingOutgoing] = useState({}); // { friendId: gameId }
    const [pendingIncoming, setPendingIncoming] = useState({}); // { friendId: gameId }
    const [openChatId, setOpenChatId] = useState(null); // Track which friend's chat is open
    const { onlineFriends, friends, socket } = useChat();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Filter user's friends to only those who are online
    const onlineFriendsList = friends.filter(friend => onlineFriends.includes(friend._id));

    useEffect(() => {
        if (!socket) return;
        // Listen for outgoing and incoming game invites
        const handleGameInvite = ({ gameId, from, to }) => {
            if (from === currentUser._id) {
                setPendingOutgoing(prev => ({ ...prev, [to]: gameId }));
            } else if (to === currentUser._id) {
                setPendingIncoming(prev => ({ ...prev, [from]: gameId }));
            }
        };
        const handleGameInviteAccepted = ({ gameId, from, to }) => {
            setPendingOutgoing(prev => {
                const updated = { ...prev };
                delete updated[to];
                return updated;
            });
            setPendingIncoming(prev => {
                const updated = { ...prev };
                delete updated[from];
                return updated;
            });
        };
        const handleGameInviteDeclined = ({ from, to }) => {
            setPendingOutgoing(prev => {
                const updated = { ...prev };
                delete updated[to];
                return updated;
            });
            setPendingIncoming(prev => {
                const updated = { ...prev };
                delete updated[from];
                return updated;
            });
        };
        socket.on('game_invite', handleGameInvite);
        socket.on('game_invite_accepted', handleGameInviteAccepted);
        socket.on('game_invite_declined', handleGameInviteDeclined);
        return () => {
            socket.off('game_invite', handleGameInvite);
            socket.off('game_invite_accepted', handleGameInviteAccepted);
            socket.off('game_invite_declined', handleGameInviteDeclined);
        };
    }, [socket, currentUser._id]);

    const handleGameStart = (gameId, opponent) => {
        setActiveGame({ gameId, opponent });
    };

    const handleGameEnd = () => {
        setActiveGame(null);
    };

    const handleChatClick = (friendId) => {
        setOpenChatId(prev => (prev === friendId ? null : friendId));
    };

    return (
        <div className="games-page">
            <div className="games-container">
                {activeGame ? (
                    <div className="active-game-section">
                        <h2>Playing Tic-tac-toe</h2>
                        <TicTacToe 
                            gameId={activeGame.gameId} 
                            opponent={activeGame.opponent}
                            onGameEnd={handleGameEnd}
                        />
                    </div>
                ) : (
                    <>
                        <div className="games-header">
                            <h2>Available Games</h2>
                        </div>
                        <div className="game-cards">
                            <div className="game-card">
                                <div className="game-icon">
                                    <i className="fas fa-gamepad"></i>
                                </div>
                                <h3>Tic-tac-toe</h3>
                                <p>Challenge a friend to a classic game of Tic-tac-toe!</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="online-friends-sidebar">
                <div className="sidebar-header">
                    <h3>Online Friends</h3>
                    <span className="online-count">{onlineFriendsList.length} Online</span>
                </div>
                {onlineFriendsList.length > 0 ? (
                    <div className="friends-list">
                        {onlineFriendsList.map(friend => {
                            const outgoing = pendingOutgoing[friend._id];
                            const incoming = pendingIncoming[friend._id];
                            return (
                                <div key={friend._id} className="friend-item">
                                    <div className="friend-info">
                                        <div className="status-dot online"></div>
                                        <span className="friend-name">{friend.FullName || friend.name}</span>
                                    </div>
                                    <div className="friend-actions">
                                        <button className="chat-btn" onClick={() => handleChatClick(friend._id)}>
                                            <i className="fas fa-comments"></i> Chat
                                        </button>
                                        <GameInvite friend={friend} onGameStart={handleGameStart} />
                                    </div>
                                    {(outgoing || incoming) && (
                                        <div className="challenge-status">
                                            {outgoing && !incoming && (
                                                <span>You challenged {friend.FullName || friend.name}!</span>
                                            )}
                                            {incoming && !outgoing && (
                                                <span>{friend.FullName || friend.name} challenged you!</span>
                                            )}
                                            {incoming && outgoing && (
                                                <span>Challenge pending with {friend.FullName || friend.name}</span>
                                            )}
                                        </div>
                                    )}
                                    {openChatId === friend._id && (
                                        <ChatBox userId={friend._id} onClose={() => setOpenChatId(null)} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-friends-message">
                        <p>No friends online right now</p>
                        <button className="invite-friends-btn">
                            <i className="fas fa-user-plus"></i> Add Friends
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GamesPage;
