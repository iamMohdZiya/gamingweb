import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import api from '../services/api';
import './ChatPanel.css';

const ChatPanel = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const { 
        onlineFriends, 
        setCurrentChat, 
        friends, 
        setFriends,
        pendingRequests,
        setPendingRequests,
        socket,
        currentChat,
        messages
    } = useChat();

    useEffect(() => {
        loadFriends();
        loadFriendRequests();
    }, []);

    const loadFriendRequests = async () => {
        try {
            const response = await api.get('/chat/friend-requests');
            setPendingRequests(response.data.requests);
        } catch (error) {
            console.error('Error loading friend requests:', error);
        }
    };

    const loadFriends = async () => {
        try {
            const response = await api.get('/chat/friends');
            setFriends(response.data.friends);
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    };

    const searchUsers = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        
        try {
            const response = await api.get(`/chat/search?query=${searchQuery}`);
            // Filter out users who are already friends
            const filteredUsers = response.data.users.filter(
                user => !friends.some(friend => friend._id === user._id)
            );
            setSearchResults(filteredUsers);
        } catch (error) {
            console.error('Error searching users:', error);
            alert('Error searching users. Please try again.');
        }
    };

    const sendFriendRequest = async (userId) => {
        try {
            const response = await api.post('/chat/friend-request', { receiverId: userId });
            if (response.data.success) {
                // Update search results to remove the user who received the request
                setSearchResults(prev => prev.filter(user => user._id !== userId));
                alert('Friend request sent successfully!');
                
                // Emit socket event for real-time notification
                if (socket) {
                    socket.emit('friendRequestSent', { to: userId });
                }
            }
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert(error.response?.data?.message || 'Failed to send friend request. Please try again.');
        }
    };

    const startChat = (userId) => {
        const friendToChat = friends.find(f => f._id === userId);
        if (friendToChat) {
            setCurrentChat(userId);
        }
    };

    const isOnline = (userId) => onlineFriends.includes(userId);

    return (
        <div className="chat-panel">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={searchUsers}>Search</button>
            </div>

            {searchResults.length > 0 && (
                <div className="search-results">
                    {searchResults.map(user => (
                        <div key={user._id} className="user-item">
                            <span>{user.FullName}</span>
                            <button 
                                onClick={() => sendFriendRequest(user._id)}
                                className="add-friend-button"
                            >
                                Add Friend
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {pendingRequests.length > 0 && (
                <div className="pending-requests">
                    <h3>Friend Requests</h3>
                    {pendingRequests.map(request => (
                        <div key={request._id} className="request-item">
                            <span>{request.sender.FullName}</span>
                            <button onClick={async () => {
                                try {
                                    await api.put(`/chat/friend-request/${request._id}/accept`);
                                    setPendingRequests(prev => prev.filter(r => r._id !== request._id));
                                    loadFriends(); // Reload friends list
                                } catch (error) {
                                    console.error('Error accepting friend request:', error);
                                }
                            }}>Accept</button>
                            <button onClick={async () => {
                                try {
                                    await api.put(`/chat/friend-request/${request._id}/reject`);
                                    setPendingRequests(prev => prev.filter(r => r._id !== request._id));
                                } catch (error) {
                                    console.error('Error rejecting friend request:', error);
                                }
                            }}>Discard</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="friends-list">
                <h3>Friends ({friends.length})</h3>
                {friends.length === 0 ? (
                    <div className="no-friends">No friends yet. Search for users to add friends!</div>
                ) : (
                    friends.map(friend => (
                        <div key={friend._id} className="friend-item">
                            <div className="friend-info">
                                <span className={`status ${onlineFriends.includes(friend._id) ? 'online' : 'offline'}`} />
                                <span>{friend.FullName}</span>
                            </div>
                            <button 
                                onClick={() => startChat(friend._id)}
                                className="chat-button"
                            >
                                Chat
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChatPanel;
