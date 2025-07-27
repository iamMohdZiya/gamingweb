import { useState } from 'react';
import TicTacToe from './TicTacToe';
import './Games.css';

const Games = ({ friends }) => {
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [gameActive, setGameActive] = useState(false);
    const [gameId, setGameId] = useState(null);

    const startGame = (friend) => {
        setSelectedFriend(friend);
        const newGameId = `game_${Date.now()}`;
        setGameId(newGameId);
        setGameActive(true);
    };

    const endGame = () => {
        setGameActive(false);
        setGameId(null);
        setSelectedFriend(null);
    };

    return (
        <div className="games-section">
            <h2>Games</h2>
            <div className="games-container">
                {gameActive && selectedFriend ? (
                    <div className="active-game">
                        <h3>Playing with {selectedFriend.name}</h3>
                        <TicTacToe 
                            gameId={gameId}
                            opponent={selectedFriend._id}
                            onGameEnd={endGame}
                        />
                    </div>
                ) : (
                    <div className="game-options">
                        <div className="game-card">
                            <h3>Tic-tac-toe</h3>
                            <p>Challenge a friend to a game of Tic-tac-toe!</p>
                            <div className="friend-list">
                                <h4>Select a friend to play with:</h4>
                                {friends && friends.length > 0 ? (
                                    friends.map(friend => (
                                        <button
                                            key={friend._id}
                                            className="friend-button"
                                            onClick={() => startGame(friend)}
                                        >
                                            Play with {friend.name}
                                        </button>
                                    ))
                                ) : (
                                    <p className="no-friends">Add friends to start playing!</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Games;
