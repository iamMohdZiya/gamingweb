import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Signup = () => {
    const [formData, setFormData] = useState({
        FullName: '',
        username: '',
        email: '',
        password: ''
    });
    const [usernameError, setUsernameError] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        if (e.target.name === 'username') {
            const value = e.target.value.toLowerCase();
            if (value && !/^[a-z0-9_-]*$/.test(value)) {
                setUsernameError('Username can only contain letters, numbers, underscores, and hyphens');
            } else if (value.length > 20) {
                setUsernameError('Username must be less than 20 characters');
            } else if (value.length < 3 && value.length > 0) {
                setUsernameError('Username must be at least 3 characters');
            } else {
                setUsernameError('');
            }
            setFormData({
                ...formData,
                username: value
            });
        } else {
            setFormData({
                ...formData,
                [e.target.name]: e.target.value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/user/signup', formData);
            if (response.data.success !== false) {
                navigate('/login'); // Redirect to login page after successful signup
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <h2>Create Account</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="FullName">Full Name:</label>
                    <input
                        type="text"
                        id="FullName"
                        name="FullName"
                        value={formData.FullName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="username">Username: (optional)</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        pattern="[a-z0-9_-]{3,20}"
                        title="Username must be 3-20 characters long and can only contain letters, numbers, underscores, and hyphens"
                        placeholder="Leave empty for auto-generation"
                    />
                    {usernameError && <div className="error-message">{usernameError}</div>}
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit" className="auth-button">Sign Up</button>
            </form>
        </div>
    );
};

export default Signup;
