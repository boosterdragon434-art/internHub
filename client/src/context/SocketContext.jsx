import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getConversations } from '../api/chatApi';
import { toast } from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [pollingMode, setPollingMode] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [typingUsers, setTypingUsers] = useState({}); // { convoId: [userIds] }

  const socketRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);

  // Keep the activeChatId ref synchronized without rebuilding the socket connection
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectSocket();
      return;
    }

    // 1. Establish Socket Connection
    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const socketClient = io(socketUrl, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 4,
      timeout: 5000,
    });

    socketRef.current = socketClient;
    setSocket(socketClient);

    // 2. Set up fallback polling sweep timeout (if WS connection fails after 4.5 seconds)
    const connectTimeout = setTimeout(() => {
      if (socketClient && !socketClient.connected) {
        setPollingMode(true);
        startPolling();
      }
    }, 4500);

    socketClient.on('connect', () => {
      clearTimeout(connectTimeout);
      setPollingMode(false);
      stopPolling();
      // Sync active conversation lists
      fetchLatestThreads();
    });

    socketClient.on('connect_error', () => {
      setPollingMode(true);
      startPolling();
    });

    // 3. Register WS Message listener
    socketClient.on('message', (message) => {
      // Direct update of thread listings last message
      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === message.conversation
              ? { ...c, lastMessage: message, updatedAt: message.createdAt }
              : c
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );

      // Trigger custom toast if message arrives in inactive thread
      if (activeChatIdRef.current !== message.conversation && message.sender?._id !== (user?.id || user?._id)) {
        toast(`New chat from ${message.sender?.name || 'User'}: "${message.content.slice(0, 30)}..."`, {
          icon: '💬',
          duration: 3500,
        });
      }
    });

    // Register Notification alerts
    socketClient.on('notification', (notif) => {
      toast(notif.title + ': ' + notif.message, {
        icon: '🔔',
        duration: 4000,
      });
    });

    // Typing Indicators
    socketClient.on('typing', ({ conversationId, userId }) => {
      setTypingUsers((prev) => {
        const list = prev[conversationId] || [];
        if (list.includes(userId)) return prev;
        return { ...prev, [conversationId]: [...list, userId] };
      });
    });

    socketClient.on('stop_typing', ({ conversationId, userId }) => {
      setTypingUsers((prev) => {
        const list = prev[conversationId] || [];
        return { ...prev, [conversationId]: list.filter((id) => id !== userId) };
      });
    });

    return () => {
      clearTimeout(connectTimeout);
      disconnectSocket();
    };
  }, [user, isAuthenticated]);

  const disconnectSocket = () => {
    stopPolling();
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
    setPollingMode(false);
    setConversations([]);
    setTypingUsers({});
  };

  // Passive/Stateless Polling Sweeps fallback
  const startPolling = () => {
    if (pollingIntervalRef.current) return;
    fetchLatestThreads();

    pollingIntervalRef.current = setInterval(async () => {
      await fetchLatestThreads();
    }, 10000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const fetchLatestThreads = async () => {
    try {
      const response = await getConversations();
      if (response.data?.success) {
        setConversations(response.data.data);
      }
    } catch (err) {
      console.error('Polling sync thread error:', err);
    }
  };

  const joinConversation = (convoId) => {
    setActiveChatId(convoId);
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_conversation', convoId);
    }
  };

  const emitTyping = (convoId, isTyping) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(isTyping ? 'typing' : 'stop_typing', convoId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        pollingMode,
        conversations,
        setConversations,
        joinConversation,
        activeChatId,
        setActiveChatId,
        typingUsers,
        emitTyping,
        fetchLatestThreads,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
export { SocketContext };
