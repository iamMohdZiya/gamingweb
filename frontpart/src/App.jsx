import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './components/Home';
import './styles/auth.css';
import './styles/home.css';
import './styles/app.css';

function App() {
  return (
    <Router>
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
          <Route path="/" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
