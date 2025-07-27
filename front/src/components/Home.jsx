import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatProvider, useChat } from '../context/ChatContext';
import ChatPanel from './ChatPanel';
import ChatBox from './ChatBox';
import Games from './Games';
import GamesPage from './GamesPage';

const Home = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activePage, setActivePage] = useState('chat');
    const token = localStorage.getItem('token');
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch (e) {
            console.error('Error parsing user from localStorage:', e);
            return null;
        }
    });
    const { currentChat, setCurrentChat } = useChat();

    useEffect(() => {
        // If no token, redirect to login
        if (!token) {
            navigate('/login');
            return;
        }
        
        if (!user) {
            setError('User information not found. Please log in again.');
            navigate('/login');
            return;
        }

        setIsLoading(false);
    }, [token, navigate, user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (isLoading) {
        return (
            <div className="home-container">
                <div className="loading-message">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="home-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="home-container">
            <nav className="home-nav">
                <div className="nav-left">
                    <h1>Welcome, {user?.FullName || 'User'}</h1>
                    <div className="nav-links">
                        <button 
                            className={`nav-link ${activePage === 'chat' ? 'active' : ''}`}
                            onClick={() => setActivePage('chat')}
                        >
                            <i className="fas fa-comments"></i> Chat
                        </button>
                        <button 
                            className={`nav-link ${activePage === 'games' ? 'active' : ''}`}
                            onClick={() => setActivePage('games')}
                        >
                            <i className="fas fa-gamepad"></i> Games
                        </button>
                        <button 
                            className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
                            onClick={() => navigate('/games')}
                        >
                            <i className="fas fa-columns"></i> Games Dashboard
                        </button>
                    </div>
                </div>
                <button onClick={handleLogout} className="logout-button">
                    <i className="fas fa-sign-out-alt"></i> Logout
                </button>
            </nav>
            <div className="main-content">
                {activePage === 'games' ? (
                    <GamesPage />
                ) : (
                    <>
                        <div className="home-content">
                            <div className="dashboard-content">
                                <div className="user-info">
                                    <h3>Your Profile</h3>
                                    <p>Name: {user?.FullName}</p>
                                    <p>Email: {user?.email}</p>
                                    <p>UserName:{user?.username}</p>
                                </div>
                            </div>
                        </div>
                        <ChatPanel />
                        {currentChat && (
                            <ChatBox 
                                userId={currentChat} 
                                onClose={() => setCurrentChat(null)} 
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;
