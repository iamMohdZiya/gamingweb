import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import { ChatProvider } from './context/ChatContext';
import './styles/auth.css';
import './styles/home.css';
import './styles/chat.css';
import './styles/app.css';
import GamesPage from './pages/GamesPage';
import TicTacToePage from './pages/TicTacToePage';

function App() {
  return (
    <Router>
      <ChatProvider>
        <div className="app">
          <nav className="nav-header">
            <h1>Game API</h1>
            <div className="nav-links">
              <a href="/login">Login</a>
              <a href="/signup">Sign Up</a>
            </div>
          </nav>
          
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/tictactoe" element={<TicTacToePage />} />
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </ChatProvider>
    </Router>
  );
}

export default App;
