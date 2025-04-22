import React from 'react';
import ReactDOM from 'react-dom/client';
import Chatbot from './components/chatbot';

const chatDiv = document.querySelector('.ai-assistant'); // Get div from index.html
if (chatDiv) {
  const chatRoot = ReactDOM.createRoot(chatDiv);
  chatRoot.render(
    <React.StrictMode>
      <Chatbot />
    </React.StrictMode>
  );
} else {
  console.error("Element with class 'ai-assistant' not found.");
}