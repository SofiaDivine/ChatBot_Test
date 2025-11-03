const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const axios = require('axios');

module.exports = (broadcast) => {
  router.post('/chats', async (req, res) => {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ msg: 'First name and last name are required' });
    }
    try {
      const newChat = new Chat({ firstName, lastName, lastMessage: null, updatedAt: Date.now() });
      const savedChat = await newChat.save();

      broadcast({ type: 'NEW_CHAT', payload: savedChat });
      res.status(201).json(savedChat);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  router.get('/chats', async (req, res) => {
    try {
      const chats = await Chat.find().sort({ updatedAt: -1 });

      const populatedChats = await Promise.all(chats.map(async (chat) => {
        try {
          return await chat.populate('lastMessage');
        } catch (err) {
          console.error(`Failed to populate chat ${chat._id}:`, err);
          return chat;
        }
      }));

      res.json(populatedChats);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  router.put('/chats/:id', async (req, res) => {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ msg: 'First name and last name are required' });
    }
    try {
      let chat = await Chat.findById(req.params.id);
      if (!chat) return res.status(404).json({ msg: 'Chat not found' });

      chat.firstName = firstName;
      chat.lastName = lastName;
      chat.updatedAt = Date.now();
      await chat.save();

      let updatedChat;
      try {
          updatedChat = await Chat.findById(req.params.id).populate('lastMessage');
      } catch (populateErr) {
          console.error("Failed to populate updated chat:", populateErr);
          updatedChat = chat;
      }

      broadcast({ type: 'UPDATED_CHAT', payload: updatedChat });
      res.json(updatedChat);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  router.delete('/chats/:id', async (req, res) => {
    try {
      const chatId = req.params.id;
      let chat = await Chat.findById(chatId);
      if (!chat) return res.status(404).json({ msg: 'Chat not found' });

      await chat.deleteOne();
      await Message.deleteMany({ chatId: chatId });

      broadcast({ type: 'DELETED_CHAT', payload: { id: chatId } });
      res.json({ msg: 'Chat removed' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  router.get('/messages/:chatId', async (req, res) => {
    try {
      const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
      res.json(messages);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  router.post('/messages', async (req, res) => {
    const { chatId, text } = req.body;
    if (!chatId || !text) {
      return res.status(400).json({ msg: 'ChatID and text are required' });
    }

    try {
      const userMessage = new Message({
        chatId,
        text,
        sender: 'user',
      });
      const savedUserMessage = await userMessage.save();

      let updatedChat = await Chat.findByIdAndUpdate(chatId, { lastMessage: savedUserMessage._id, updatedAt: Date.now() }, { new: true });
      if (updatedChat) {
        try {
          updatedChat = await updatedChat.populate('lastMessage');
        } catch (populateErr) {
          console.error("Failed to populate updatedChat:", populateErr);
        }
      }

      broadcast({ type: 'NEW_MESSAGE', payload: savedUserMessage });
      broadcast({ type: 'UPDATED_CHAT', payload: updatedChat });

      res.status(201).json(savedUserMessage);

      (async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 3000));

          const quoteResponse = await axios.get('https://dummyjson.com/quotes/random');
          const quoteData = quoteResponse.data;
          const botText = `${quoteData.quote} - ${quoteData.author}`;

          const botMessage = new Message({
            chatId,
            text: botText,
            sender: 'bot',
          });
          const savedBotMessage = await botMessage.save();

          let updatedChatBot = await Chat.findByIdAndUpdate(chatId, { lastMessage: savedBotMessage._id, updatedAt: Date.now() }, { new: true });
          if (updatedChatBot) {
            try {
              updatedChatBot = await updatedChatBot.populate('lastMessage');
            } catch (populateErr) {
              console.error("Failed to populate updatedChatBot:", populateErr);
            }
          }

          broadcast({ type: 'NEW_MESSAGE', payload: savedBotMessage });
          broadcast({ type: 'UPDATED_CHAT', payload: updatedChatBot });

          console.log(`Bot replied to chat ${chatId}`);

        } catch (botError) {
          console.error('Bot reply error:', botError.message);
        }
      })();

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  return router;
};

