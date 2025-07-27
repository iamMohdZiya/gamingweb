import { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import GameInvite from '../components/GameInvite';
import TicTacToe from '../components/TicTacToe';
import ChatBox from '../components/ChatBox';
import './GamesPage.css';

const TicTacToePage = () => {
  const [activeGame, setActiveGame] = useState(null);
  const [pendingOutgoing, setPendingOutgoing] = useState({});
  const [pendingIncoming, setPendingIncoming] = useState({});
  const [gameRequests, setGameRequests] = useState([]);
  const [openChatId, setOpenChatId] = useState(null);
  const { onlineFriends, friends, socket } = useChat();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Exclude self from friends list
  const filteredFriends = friends.filter(friend => friend._id !== currentUser._id);
  // Make sure we're properly filtering online friends by comparing string IDs
  const onlineFriendsList = filteredFriends.filter(friend => 
    onlineFriends.some(onlineId => onlineId.toString() === friend._id.toString())
  );

  useEffect(() => {
    if (!socket) return;
    
    const fetchGameRequests = async () => {
      try {
        const response = await fetch('/user/game-requests');
        const data = await response.json();
        setGameRequests(data);
      } catch (error) {
        console.error('Error fetching game requests:', error);
      }
    };
    
    fetchGameRequests();

    const handleGameInvite = ({ gameId, from, to }) => {
      if (from === currentUser._id) {
        setPendingOutgoing(prev => ({ ...prev, [to]: gameId }));
      } else if (to === currentUser._id) {
        setPendingIncoming(prev => ({ ...prev, [from]: gameId }));
      }
      fetchGameRequests();
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
      fetchGameRequests();
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
      fetchGameRequests();
    };
    
    socket.on('game_invite', handleGameInvite);
    socket.on('game_invite_accepted', handleGameInviteAccepted);
    socket.on('game_invite_declined', handleGameInviteDeclined);
    socket.on('updateGameRequests', fetchGameRequests);
    
    return () => {
      socket.off('game_invite', handleGameInvite);
      socket.off('game_invite_accepted', handleGameInviteAccepted);
      socket.off('game_invite_declined', handleGameInviteDeclined);
      socket.off('updateGameRequests', fetchGameRequests);
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
              <h2>Tic Tac Toe - Challenge a Friend</h2>
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

export default TicTacToePage;