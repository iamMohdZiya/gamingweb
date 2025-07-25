import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        // If no token, redirect to login
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="home-container">
            <nav className="home-nav">
                <h1>Welcome, {user?.FullName || 'User'}</h1>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </nav>
            <div className="home-content">
                <h2>Dashboard</h2>
                {/* Add your dashboard content here */}
            </div>
        </div>
    );
};

export default Home;
