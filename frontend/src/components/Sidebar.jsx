import React from 'react';
import { getInitials, formatDate } from './utils';

function ChatItem({ chat, isSelected, unread, onSelect }) {
  return (
    <div
      className={`chat-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(chat)}
    >
      <div className="avatar">
        {getInitials(chat.firstName, chat.lastName)}
      </div>
      <div className="chat-info">
        <div className="chat-name">
          {chat.firstName} {chat.lastName}
        </div>
        <div className="last-message">
          {chat.lastMessage ? chat.lastMessage.text : 'No messages yet...'}
        </div>
      </div>
      <div className="chat-meta">
        <div className="chat-date">
          {formatDate(chat.lastMessage?.createdAt || chat.updatedAt)}
        </div>
        {unread && (
          <span className="unread-badge"></span>
        )}
      </div>
    </div>
  );
}

function ChatList({ chats, selectedChatId, unreadChats, onSelectChat, onNewChat }) {
  return (
    <>
      <div className="chat-list-header">
        <span>Chats</span>
        <button className="new-chat-btn" onClick={onNewChat}>+</button>
      </div>
      <div className="chat-list">
        {chats.map((chat) => (
          <ChatItem
            key={chat._id}
            chat={chat}
            isSelected={selectedChatId === chat._id}
            unread={unreadChats.has(chat._id)}
            onSelect={onSelectChat}
          />
        ))}
      </div>
    </>
  );
}

function SidebarHeader({ searchTerm, onSearchChange, isRandomOn, onToggleRandom }) {
  return (
    <header className="sidebar-header">
      <div className="profile-info">
        <div className="avatar profile-avatar">G</div>
        <span>Guest User</span>
      </div>
      <input
        type="text"
        placeholder="Search or start new chat"
        className="search-bar"
        value={searchTerm}
        onChange={onSearchChange}
      />
      <div className="toggle-random">
        <label htmlFor="random-toggle">Random Bot</label>
        <button
          id="random-toggle"
          className={`toggle-btn ${isRandomOn ? 'on' : 'off'}`}
          onClick={onToggleRandom}
          title={isRandomOn ? 'Turn off random messages' : 'Turn on random messages'}
        >
          <span className="toggle-switch"></span>
        </button>
      </div>
    </header>
  );
}

function Sidebar({
  chats,
  selectedChat,
  unreadChats,
  onSelectChat,
  onNewChat,
  searchTerm,
  onSearchChange,
  isRandomOn,
  onToggleRandom
}) {
  return (
    <aside className="sidebar">
      <SidebarHeader
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        isRandomOn={isRandomOn}
        onToggleRandom={onToggleRandom}
      />
      <ChatList
        chats={chats}
        selectedChatId={selectedChat?._id}
        unreadChats={unreadChats}
        onSelectChat={onSelectChat}
        onNewChat={onNewChat}
      />
    </aside>
  );
}

export default Sidebar;
