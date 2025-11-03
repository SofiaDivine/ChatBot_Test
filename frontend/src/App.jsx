import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ModalManager from './components/ModalManager';
import Toast from './components/Toast';

const API_URL = 'http://localhost:5000/api';
const WS_URL = 'ws://localhost:5000';

function App() {
  const [chats, setChats] = useState([]);

  const [selectedChat, _setSelectedChat] = useState(null);
  const selectedChatRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [modalView, setModalView] = useState('none');
  const [formData, setFormData] = useState({ firstName: '', lastName: '' });
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isRandomSenderOn, setIsRandomSenderOn] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [unreadChats, setUnreadChats] = useState(new Set());

  const ws = useRef(null);
  const messageListRef = useRef(null);

  const setSelectedChat = (chat) => {
    _setSelectedChat(chat);
    selectedChatRef.current = chat;
  };

  // Завантажуємо ВСІ чати при першому запуску
  useEffect(() => {
    fetchChats();
  }, []);

  // Завантажуємо ПОВІДОМЛЕННЯ, коли змінюється selectedChat
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isBotTyping]);

  // Встановлюємо WebSocket з'єднання
  useEffect(() => {
    connectWebSocket();
    // Чистимо з'єднання
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []); // Запускаємо лише один раз

  // WEBSOCKET

  const connectWebSocket = () => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket Message Received:', data); // ДЛЯ ДЕБАГУ
      handleWebSocketMessage(data);
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected. Reconnecting in 3 seconds...');
      setTimeout(connectWebSocket, 3000);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
      ws.current.close();
    };
  };

  const handleWebSocketMessage = (data) => {
    const { type, payload } = data;
    const currentSelectedChat = selectedChatRef.current;

    switch (type) {
      case 'STATUS_UPDATE':
        setIsRandomSenderOn(payload.isRandomSenderOn);
        break;

      case 'NEW_MESSAGE': {
        const message = payload;

        if (currentSelectedChat && message.chatId === currentSelectedChat._id) {
          if (message.sender === 'bot') {
            setIsBotTyping(false);
          }

          setMessages((prevMessages) => {
            if (message.sender === 'user') {
              const tempMsgIndex = prevMessages.findIndex(msg =>
                msg._id.startsWith('temp_') &&
                msg.text === message.text &&
                msg.sender === 'user'
              );

              if (tempMsgIndex !== -1) {
                const newMessages = [...prevMessages];
                newMessages[tempMsgIndex] = message;
                return newMessages;
              } else {
                if (prevMessages.some(msg => msg._id === message._id)) {
                  return prevMessages;
                }
                return [...prevMessages, message];
              }
            } else {
              if (prevMessages.some(msg => msg._id === message._id)) {
                return prevMessages;
              }
              return [...prevMessages, message];
            }
          });
        } else {
          if (message.sender === 'bot') {
            setUnreadChats((prevUnread) => new Set(prevUnread).add(message.chatId));
          }
        }

        if (message.sender === 'bot' && (!currentSelectedChat || message.chatId !== currentSelectedChat._id)) {
          showToast(`New bot message!`);
        }
        break;
      }

      case 'RANDOM_MESSAGE': {
        const { message, chat } = payload;

        if (currentSelectedChat && message.chatId === currentSelectedChat._id) {
           setIsBotTyping(false);
           setMessages((prevMessages) => {
            if (prevMessages.some(msg => msg._id === message._id)) {
              return prevMessages;
            }
            return [...prevMessages, message];
          });
        } else {
          setUnreadChats((prevUnread) => new Set(prevUnread).add(message.chatId));
        }

        showToast(`Bot sent a random message to ${chat.firstName}!`, 'info');
        break;
      }

      case 'UPDATED_CHAT': {
        const updatedChat = payload;
        if (!updatedChat) break;

        setChats((prevChats) =>
          prevChats.map(chat => chat._id === updatedChat._id ? updatedChat : chat)
                   .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        );
        break;
      }

      case 'NEW_CHAT': {
        const newChat = payload;
        setChats((prevChats) => [newChat, ...prevChats]
                   .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        break;
      }

      case 'DELETED_CHAT': {
        const { id } = payload;
        setChats((prevChats) => prevChats.filter(chat => chat._id !== id));
        if (currentSelectedChat && currentSelectedChat._id === id) {
          setSelectedChat(null);
        }
        break;
      }

      default:
        console.warn('Unknown WS message type:', type);
    }
  };


  // ФУНКЦІЇ ДЛЯ API

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/chats`);
      const sortedChats = response.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setChats(sortedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
    setLoading(false);
  };

  const fetchMessages = async (chatId) => {
    setLoading(true);
    setIsBotTyping(false);
    try {
      const response = await axios.get(`${API_URL}/messages/${chatId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      chatId: selectedChat._id,
      text: newMessage,
      sender: 'user',
      createdAt: new Date().toISOString(),
    };
    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);

    setIsBotTyping(true);

    const textToSend = newMessage;
    setNewMessage('');

    try {
      await axios.post(`${API_URL}/messages`, {
        chatId: selectedChat._id,
        text: textToSend,
      });

    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
      setIsBotTyping(false);
      setMessages((prevMessages) =>
        prevMessages.filter(msg => msg._id !== optimisticMessage._id)
      );
    }
  };

  //CRUD ЧАТІВ
  const handleCreateChat = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      setModalError('First name and last name are required');
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/chats`, formData);
      setChats((prevChats) => [response.data, ...prevChats]
                           .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      setSelectedChat(response.data);
      handleCloseModal();
      showToast('Chat created successfully!');
    } catch (error) {
      console.error('Error creating chat:', error);
      setModalError('Failed to create chat. Please try again.');
    }
  };

  const handleUpdateChat = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !selectedChat) {
      setModalError('First name and last name are required');
      return;
    }
    try {
      const response = await axios.put(`${API_URL}/chats/${selectedChat._id}`, formData);
      setChats((prevChats) =>
        prevChats.map(chat => chat._id === selectedChat._id ? response.data : chat)
                 .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
      setSelectedChat(response.data);
      handleCloseModal();
      showToast('Chat updated successfully!');
    } catch (error) {
      console.error('Error updating chat:', error);
      showToast('Failed to update chat', 'error');
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedChat) return;
    try {
      await axios.delete(`${API_URL}/chats/${selectedChat._id}`);
      setChats((prevChats) => prevChats.filter(chat => chat._id !== selectedChat._id));
      setSelectedChat(null);
      handleCloseModal();
      showToast('Chat deleted successfully!', 'error');
    } catch (error) {
      console.error('Error deleting chat:', error);
      showToast('Failed to delete chat.', 'error');
    }
  };

  // УПРАВЛІННЯ МОДАЛЬНИМИ ВІКНАМИ
  const handleOpenModal = (type, chat = null) => {
    setModalError('');
    if (type === 'create') {
      setFormData({ firstName: '', lastName: '' });
      setModalView('create');
    } else if (type === 'edit' && chat) {
      setFormData({ firstName: chat.firstName, lastName: chat.lastName });
      setModalView('edit');
    } else if (type === 'delete' && chat) {
      setModalView('delete');
    }
  };
  const handleCloseModal = () => {
    setModalView('none');
    setModalError('');
  };
  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //TOAST-СПОВІЩЕННЯ
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleSelectChat = (chat) => {
    setIsBotTyping(false);
    setSelectedChat(chat);
    if (unreadChats.has(chat._id)) {
      setUnreadChats((prevUnread) => {
        const newUnread = new Set(prevUnread);
        newUnread.delete(chat._id);
        return newUnread;
      });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const toggleRandomSender = () => {
    if (ws.current && ws.current.readyState === ws.current.OPEN) {
      ws.current.send(JSON.stringify({ type: 'TOGGLE_RANDOM_SENDER' }));
    }
  };

  //  Фільтрація
  const filteredChats = chats.filter((chat) =>
    `${chat.firstName} ${chat.lastName}`.toLowerCase().includes(searchTerm)
  );

  // HTML-розмітка
  return (
    <div className="app-container">
      <Sidebar
        chats={filteredChats}
        selectedChat={selectedChat}
        unreadChats={unreadChats}
        onSelectChat={handleSelectChat}
        onNewChat={() => handleOpenModal('create')}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        isRandomOn={isRandomSenderOn}
        onToggleRandom={toggleRandomSender}
      />

      <ChatWindow
        chat={selectedChat}
        messages={messages}
        loading={loading}
        isBotTyping={isBotTyping}
        messageListRef={messageListRef}
        onSendMessage={handleSendMessage}
        onEditChat={() => handleOpenModal('edit', selectedChat)}
        onDeleteChat={() => handleOpenModal('delete', selectedChat)}
        newMessage={newMessage}
        onNewMessageChange={(e) => setNewMessage(e.target.value)}
      />

      <ModalManager
        view={modalView}
        error={modalError}
        formData={formData}
        onClose={handleCloseModal}
        onChange={handleFormChange}
        onCreate={handleCreateChat}
        onUpdate={handleUpdateChat}
        onDelete={handleDeleteChat}
      />

      <Toast {...toast} />
    </div>
  );
}

export default App;

