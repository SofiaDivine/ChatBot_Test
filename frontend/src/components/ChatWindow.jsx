import React from 'react';
import { getInitials, formatDate } from './utils';

function MessageBubble({ msg }) {
  return (
    <div
      key={msg._id}
      className={`message-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}
    >
      <div className="message-text">{msg.text}</div>
      <div className="message-time">
        {formatDate(msg.createdAt)}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="message-bubble bot typing-indicator">
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );
}

function MessageList({ messages, isBotTyping, loading, messageListRef }) {
  return (
    <div className="message-list" ref={messageListRef}>
      {loading && <div className="loader">Loading messages...</div>}
      {messages.map((msg) => (
        <MessageBubble key={msg._id} msg={msg} />
      ))}
      {isBotTyping && <TypingIndicator />}
    </div>
  );
}

function MessageInput({ value, onChange, onSubmit, isTyping }) {
  return (
    <footer className="chat-footer">
      <form className="message-form" onSubmit={onSubmit}>
        <input
          type="text"
          className="message-input"
          placeholder="Type your message"
          value={value}
          onChange={onChange}
          disabled={isTyping}
        />
        <button type="submit" className="send-btn" disabled={isTyping}>
          Send
        </button>
      </form>
    </footer>
  );
}

function ChatHeader({ chat, onEdit, onDelete }) {
  return (
    <header className="chat-header">
      <div className="avatar">
        {getInitials(chat.firstName, chat.lastName)}
      </div>
      <div className="chat-name-status">
        <span className="chat-name">
          {chat.firstName} {chat.lastName}
        </span>
        <span className="chat-status">Online</span>
      </div>
      <div className="chat-actions">
        <button
          className="chat-action-btn"
          onClick={onEdit}
          title="Edit Chat"
        >
          ✎
        </button>
        <button
          className="chat-action-btn"
          onClick={onDelete}
          title="Delete Chat"
        >
          🗑
        </button>
      </div>
    </header>
  );
}

function ChatWindow({
  chat,
  messages,
  loading,
  isBotTyping,
  messageListRef,
  onSendMessage,
  onEditChat,
  onDeleteChat,
  newMessage,
  onNewMessageChange
}) {
  if (!chat) {
    return (
      <main className="chat-window">
        <div className="no-chat-selected">
          <h2>Select a chat to start messaging</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-window">
      <ChatHeader
        chat={chat}
        onEdit={onEditChat}
        onDelete={onDeleteChat}
      />
      <MessageList
        messages={messages}
        isBotTyping={isBotTyping}
        loading={loading}
        messageListRef={messageListRef}
      />
      <MessageInput
        value={newMessage}
        onChange={onNewMessageChange}
        onSubmit={onSendMessage}
        isTyping={isBotTyping}
      />
    </main>
  );
}

export default ChatWindow;
