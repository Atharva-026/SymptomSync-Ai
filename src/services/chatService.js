import api from './api';

const chatService = {
  sendMessage: async (message, conversationId, importedContext) => {
    const res = await api.post('/chat/message', { message, conversationId, importedContext });
    return res.data;
  },
  importContext: async (conversationIds) => (await api.post('/chat/import', { conversationIds })).data,
  getContext: async () => (await api.get('/chat/context')).data,
  createBrief: async (conversationId) =>
    (await api.post(`/chat/conversations/${conversationId}/brief`)).data,
  clearContext: async () => (await api.delete('/chat/context')).data,
  listConversations: async () => (await api.get('/chat/conversations')).data,
  getConversation: async (id) => (await api.get(`/chat/conversations/${id}`)).data,
  deleteConversation: async (id) => (await api.delete(`/chat/conversations/${id}`)).data
};

export default chatService;