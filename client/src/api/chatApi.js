import api from './axios';

/**
 * Chat API service — handles thread retrieval, paginated messages sync, and message creation.
 */

/** Get conversation list for the active user */
export const getConversations = () => api.get('/chat/conversations');

/** Get available chat recipients based on RBAC rules */
export const getChatRecipients = () => api.get('/chat/recipients');

/** Initiate or fetch a direct chat thread */
export const getOrCreateConversation = (recipientId) => api.post('/chat/conversations', { recipientId });

/** Fetch paginated chat messages */
export const getMessages = (conversationId, params = {}) =>
  api.get(`/chat/conversations/${conversationId}/messages`, { params });

/** Send a new message inside a thread */
export const sendMessage = (data) => api.post('/chat/messages', data);
