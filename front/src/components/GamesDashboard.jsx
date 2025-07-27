import { useNavigate } from 'react-router-dom';
import './Games.css';

const GamesDashboard = () => {
  const navigate = useNavigate();
  
  return (
    <div className="games-dashboard">
      <h2>Available Games</h2>
      <div className="games-grid">
        <div className="game-card" onClick={() => navigate('/games/tictactoe')}>
          <div className="game-icon">
            <i className="fas fa-gamepad"></i>
          </div>
          <h3>Tic Tac Toe</h3>
          <p>Challenge your friends to a classic game of Tic Tac Toe!</p>
          <button className="play-button">
            <i className="fas fa-play"></i> Play
          </button>
        </div>
        {/* More games can be added here in the future */}
      </div>
    </div>
  );
};

export default GamesDashboard;