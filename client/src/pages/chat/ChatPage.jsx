import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getMessages, sendMessage, getChatRecipients, getOrCreateConversation } from '../../api/chatApi';
import { toast } from 'react-hot-toast';
import {
  FiSend,
  FiSearch,
  FiUser,
  FiMessageSquare,
  FiClock,
  FiCheck,
  FiPlus,
  FiX,
  FiAlertCircle,
  FiActivity
} from 'react-icons/fi';

const ChatPage = () => {
  const { user } = useAuth();
  const {
    socket,
    pollingMode,
    conversations,
    setConversations,
    joinConversation,
    activeChatId,
    setActiveChatId,
    typingUsers,
    emitTyping,
    fetchLatestThreads
  } = useSocket();

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const [isTypingState, setIsTypingState] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch conversations lists & initial state setup
  useEffect(() => {
    fetchLatestThreads();
  }, []);

  // 2. Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const response = await getMessages(activeChatId);
        if (response.data?.success) {
          setMessages(response.data.data);
          // Wait for render, then scroll down
          setTimeout(scrollToBottom, 50);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        toast.error('Could not load chat history.');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
    joinConversation(activeChatId);
  }, [activeChatId]);

  // 3. Socket real-time message listener for active conversation
  useEffect(() => {
    if (!socket || !activeChatId) return;

    const handleNewMessage = (msg) => {
      if (msg.conversation === activeChatId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 50);
      }
    };

    socket.on('message', handleNewMessage);
    return () => {
      socket.off('message', handleNewMessage);
    };
  }, [socket, activeChatId]);

  // 4. Polling Fallback messaging sync
  useEffect(() => {
    if (!activeChatId || !pollingMode) return;

    const interval = setInterval(async () => {
      try {
        const response = await getMessages(activeChatId);
        if (response.data?.success) {
          setMessages(response.data.data);
        }
      } catch (err) {
        console.error('Stateless message sync error:', err);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [activeChatId, pollingMode]);

  // 5. Scroll helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 6. Handle Typing logic
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!isTypingState) {
      setIsTypingState(true);
      emitTyping(activeChatId, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingState(false);
      emitTyping(activeChatId, false);
    }, 2000);
  };

  // 7. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      conversationId: activeChatId,
      content: inputText.trim(),
      attachments: []
    };

    // Clean input & typing indicator instantly
    setInputText('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTypingState(false);
    emitTyping(activeChatId, false);

    try {
      const response = await sendMessage(payload);
      if (response.data?.success) {
        const sentMessage = response.data.data;
        setMessages((prev) => [...prev, sentMessage]);
        setTimeout(scrollToBottom, 50);

        // Update list
        setConversations((prev) =>
          prev
            .map((c) =>
              c._id === activeChatId
                ? { ...c, lastMessage: sentMessage, updatedAt: sentMessage.createdAt }
                : c
            )
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Message failed to deliver.');
    }
  };

  // 8. Load authorized recipients for new thread
  const handleOpenNewChat = async () => {
    setShowNewChatModal(true);
    setLoadingRecipients(true);
    try {
      const response = await getChatRecipients();
      if (response.data?.success) {
        setRecipients(response.data.data);
      }
    } catch (err) {
      console.error('Could not fetch recipients:', err);
      toast.error('Could not retrieve contact list.');
    } finally {
      setLoadingRecipients(false);
    }
  };

  // 9. Start direct chat thread with selected recipient
  const handleStartThread = async (recipientId) => {
    setShowNewChatModal(false);
    try {
      const response = await getOrCreateConversation(recipientId);
      if (response.data?.success) {
        const newConvo = response.data.data;
        
        // Push conversation into list if missing
        setConversations((prev) => {
          if (prev.some((c) => c._id === newConvo._id)) return prev;
          // Set recipient object details locally
          const updated = {
            ...newConvo,
            recipient: newConvo.participants.find((p) => p._id !== user.id)
          };
          return [updated, ...prev];
        });

        setActiveChatId(newConvo._id);
        toast.success('Discussion workspace initialized.');
      }
    } catch (err) {
      console.error('Could not create thread:', err);
      toast.error('Authorized messaging scope issue.');
    }
  };

  // Filtering helpers
  const filteredConversations = conversations.filter((convo) => {
    const name = convo.recipient?.name || '';
    const lastMsg = convo.lastMessage?.content || '';
    return (
      name.toLowerCase().includes(chatSearch.toLowerCase()) ||
      lastMsg.toLowerCase().includes(chatSearch.toLowerCase())
    );
  });

  const filteredRecipients = recipients.filter((r) =>
    r.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    r.email.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const activeConvoDetails = conversations.find((c) => c._id === activeChatId);
  const activeRecipient = activeConvoDetails?.recipient;

  return (
    <div className="relative min-h-[calc(100vh-6rem)] p-4 md:p-6 lg:p-8 flex flex-col">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 via-slate-200 to-indigo-100/20 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 -z-10 rounded-3xl" />
      
      {/* Glassmorphic main workspace frame */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl min-h-[500px]">
        
        {/* Left Side Pane: Conversations List */}
        <div className="lg:col-span-1 border-r border-slate-200 dark:border-slate-800/80 flex flex-col h-full min-h-[400px]">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
            <div>
              <h2 className="text-xl font-bold tracking-wide bg-gradient-to-r from-slate-800 to-slate-650 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Direct Messages</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${pollingMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
                {pollingMode ? 'Passive Polling Active' : 'WebSocket Live Feed'}
              </p>
            </div>
            <button
              onClick={handleOpenNewChat}
              className="p-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95 transition-all duration-200 flex items-center justify-center"
              title="Start New Discussion"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/20">
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search direct threads..."
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950/60 text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm shadow-sm"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-21rem)] lg:max-h-[calc(100vh-17rem)]">
            {filteredConversations.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <FiMessageSquare className="w-10 h-10 mx-auto text-slate-350 dark:text-slate-700 mb-3 animate-pulse" />
                <p className="text-sm font-semibold">No discussions found</p>
                <p className="text-xs mt-1 text-slate-500 dark:text-slate-600">Start a new secure conversation above</p>
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isActive = convo._id === activeChatId;
                const typingUserIds = typingUsers[convo._id] || [];
                const isRecipientTyping = typingUserIds.some((id) => id === convo.recipient?._id);

                return (
                  <button
                    key={convo._id}
                    onClick={() => setActiveChatId(convo._id)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 flex items-center gap-3.5 border ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-250 dark:border-indigo-500/40 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:border-slate-100 dark:hover:border-slate-800/50'
                    }`}
                  >
                    {/* Avatar bubble */}
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/65 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-bold uppercase overflow-hidden shadow-inner">
                        {convo.recipient?.avatar ? (
                          <img src={convo.recipient.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          convo.recipient?.name?.charAt(0) || '?'
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm animate-pulse" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-sm font-bold text-slate-850 dark:text-white truncate">
                          {convo.recipient?.name || 'Unknown User'}
                        </h4>
                        {convo.lastMessage && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {new Date(convo.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {isRecipientTyping ? (
                        <p className="text-xs text-indigo-600 dark:text-indigo-450 font-bold animate-pulse">typing...</p>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {convo.lastMessage?.sender?._id === user.id ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold mr-1">You:</span>
                          ) : null}
                          {convo.lastMessage?.content || 'No messages yet'}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side Pane: Chat Viewport */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-[450px]">
          {activeChatId && activeRecipient ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold uppercase overflow-hidden">
                    {activeRecipient.avatar ? (
                      <img src={activeRecipient.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      activeRecipient.name?.charAt(0) || '?'
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
                      {activeRecipient.name}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-extrabold tracking-wider ${
                        activeRecipient.role === 'admin'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border border-rose-500/20'
                          : activeRecipient.role === 'guide'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-450 border border-indigo-500/20'
                      }`}>
                        {activeRecipient.role}
                      </span>
                    </h3>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1 font-medium">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Active Secure Tunnel
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
                  <FiClock className="w-3.5 h-3.5" />
                  <span>Direct Workspace</span>
                </div>
              </div>

              {/* Message log Timeline */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/20">
                {loadingMessages ? (
                  <div className="py-32 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto" />
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Fetching discussions...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-32 text-center text-slate-400 dark:text-slate-650">
                    <FiMessageSquare className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-800 mb-3 animate-pulse" />
                    <p className="text-sm font-semibold text-slate-500">Secure conversation initialized</p>
                    <p className="text-xs mt-1.5 text-slate-500 dark:text-slate-600">Send a message below to start private discussing.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSelf = msg.sender?._id === user.id || msg.sender === user.id;
                    const dateStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    
                    // Determine if recipient has opened and read the message
                    const isReadByRecipient = msg.readBy?.some(
                      (entry) => {
                        const readerId = entry.user?._id || entry.user || entry;
                        return readerId?.toString() === activeRecipient?._id?.toString();
                      }
                    );

                    return (
                      <div
                        key={msg._id || idx}
                        className={`flex gap-3.5 max-w-[80%] ${isSelf ? 'ml-auto justify-end' : 'mr-auto'}`}
                      >
                        {/* Avatar bubble - only show for incoming recipient messages */}
                        {!isSelf && (
                          <div className="w-8.5 h-8.5 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700/60 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 overflow-hidden select-none">
                            {msg.sender?.avatar ? (
                              <img src={msg.sender.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              msg.sender?.name?.charAt(0).toUpperCase() || 'U'
                            )}
                          </div>
                        )}

                        {/* Bubble container */}
                        <div className="space-y-1">
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
                            isSelf
                              ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 dark:from-violet-500 dark:to-indigo-500 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>

                          {/* Timestamp and ticks status */}
                          <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <span>{dateStr}</span>
                            {isSelf && (
                              <span className="flex items-center">
                                {isReadByRecipient ? (
                                  <span className="text-violet-600 dark:text-indigo-400 flex items-center" title="Read">
                                    <FiCheck className="w-3.5 h-3.5" />
                                    <FiCheck className="w-3.5 h-3.5 -ml-2" />
                                  </span>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 flex items-center" title="Sent">
                                    <FiCheck className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                
                {/* Typing status indicator */}
                {activeRecipient?._id && typingUsers[activeChatId]?.some((id) => id === activeRecipient._id) && (
                  <div className="flex gap-3 items-center text-xs text-indigo-600 dark:text-indigo-400 italic">
                    <div className="w-8.5 h-8.5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold">
                      {activeRecipient.name ? activeRecipient.name.charAt(0) : 'U'}
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-full shadow-sm">
                      <span>{activeRecipient.name || 'User'} is typing</span>
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-700" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-800" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-900" />
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Secure Message Composition Input Area */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/50">
                <form onSubmit={handleSendMessage} className="relative flex items-center bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500/50 transition-all duration-200">
                  <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder={`Type a secure message for ${activeRecipient.name}...`}
                    className="flex-1 py-4 pl-5 pr-14 text-sm bg-transparent text-slate-850 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none border-none"
                  />

                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all duration-150 flex items-center justify-center shadow-md shadow-indigo-600/10"
                    >
                      <FiSend className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            /* Premium Empty Workspace View */
            <div className="flex-1 flex flex-col justify-center items-center p-8 text-center bg-slate-50/20 dark:bg-slate-950/10">
              <div className="relative mb-6">
                {/* Concentric spinning rings */}
                <div className="absolute inset-0 w-24 h-24 rounded-full border border-indigo-500/20 animate-spin [animation-duration:8s]" />
                <div className="absolute -inset-2 w-28 h-28 rounded-full border border-dashed border-indigo-500/10 animate-spin [animation-duration:12s] [animation-direction:reverse]" />
                
                <div className="w-24 h-24 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xl shadow-indigo-500/5">
                  <FiMessageSquare className="w-10 h-10" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-850 dark:text-white tracking-wide">Direct Messenger Portal</h3>
              <p className="text-slate-550 dark:text-slate-400 text-sm max-w-sm mt-2.5 leading-relaxed">
                Connect and communicate in a private secure tunnel with administrators and guides assigned to your academic workflow!
              </p>

              <button
                onClick={handleOpenNewChat}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl active:scale-95 shadow-lg shadow-indigo-600/20 transition-all duration-200"
              >
                <FiPlus className="w-4 h-4" />
                <span>Start New Discussion</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recipient Search Modal overlay */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
            
            {/* Header */}
            <div className="p-4.5 border-b border-slate-250 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-base font-bold text-slate-850 dark:text-white">Start a Discussion</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Search Input */}
            <div className="p-4 border-b border-slate-250 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/20">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-450 dark:text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Filter users..."
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-950/80 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-250 dark:border-slate-850 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-xs shadow-sm"
                />
              </div>
            </div>

            {/* Recipients Scroll List */}
            <div className="max-h-80 overflow-y-auto p-3 space-y-1 bg-slate-50 dark:bg-slate-950/30">
              {loadingRecipients ? (
                <div className="py-16 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 mx-auto" />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Loading authorized contacts...</p>
                </div>
              ) : filteredRecipients.length === 0 ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                  <FiAlertCircle className="w-8 h-8 mx-auto text-slate-350 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-semibold">No contacts available</p>
                  <p className="text-[10px] mt-0.5 text-slate-500 dark:text-slate-600">No authorized contacts matching filter</p>
                </div>
              ) : (
                filteredRecipients.map((recip) => (
                  <button
                    key={recip._id}
                    onClick={() => handleStartThread(recip._id)}
                    className="w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-150 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-indigo-650 dark:text-indigo-400 font-bold uppercase text-xs overflow-hidden">
                      {recip.avatar ? (
                        <img src={recip.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        recip.name ? recip.name.charAt(0) : 'U'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-white truncate flex items-center gap-1.5">
                        {recip.name || 'Unknown User'}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                          recip.role === 'admin'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/20'
                            : recip.role === 'guide'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-455 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-455 border border-indigo-500/20'
                        }`}>
                          {recip.role}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 truncate">{recip.email}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
