import { useState } from 'react';
import { useChat } from '../context/ChatContext';
import TicTacToe from './TicTacToe';
import './Chat.css';

const Chat = ({ friend }) => {
    const [message, setMessage] = useState('');
    const [gameActive, setGameActive] = useState(false);
    const [gameId, setGameId] = useState(null);
    const [opponent, setOpponent] = useState(null);
    const { socket, messages } = useChat();
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const handleGameStart = (newGameId, opponentId) => {
        setGameId(newGameId);
        setOpponent(opponentId);
        setGameActive(true);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        socket.emit('private_message', {
            content: message,
            to: friend._id,
        });
        setMessage('');
    };

    const startGame = () => {
        const newGameId = `game_${Date.now()}`;
        setGameId(newGameId);
        setGameActive(true);
        socket.emit('game_invite', {
            gameId: newGameId,
            opponent: friend._id
        });
    };

    const endGame = () => {
        setGameActive(false);
        setGameId(null);
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="user-info">
                    <div className={`status-indicator ${friend.isOnline ? 'online' : 'offline'}`}></div>
                    <h3>{friend.name}</h3>
                </div>
                <div className="chat-actions">
                    <GameInvite friend={friend} onGameStart={handleGameStart} />
                </div>
            </div>

            {gameActive ? (
                <TicTacToe 
                    gameId={gameId}
                    opponent={friend._id}
                    onGameEnd={endGame}
                />
            ) : (
                <>
                    <div className="messages">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${
                                    msg.from === currentUser._id ? 'sent' : 'received'
                                }`}
                            >
                                {msg.content}
                            </div>
                        ))}
                    </div>
                    <form className="message-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                        />
                        <button type="submit">Send</button>
                    </form>
                </>
            )}
        </div>
    );
};

export default Chat;
