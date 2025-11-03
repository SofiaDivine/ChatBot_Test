import React from 'react';

function Toast({ message, type, show }) {
  return (
    <div className={`toast-notification ${type} ${show ? 'show' : ''}`}>
      {message}
    </div>
  );
}

export default Toast;
