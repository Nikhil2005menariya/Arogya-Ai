import React, { useState } from "react";
import "./chatbot.css";
import axios from "../api/axios";
import { marked } from "marked"; // Import the marked library

const RESPONSE_URL = "./generateResponse";

const ChatBot = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", sender: "bot" },
  ]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (userInput.trim()) {
      setLoading(true);

      const text = userInput;
      setMessages([...messages, { text, sender: "user" }]);
      setUserInput("");

      try {
        const response = await axios.post(
          RESPONSE_URL,
          JSON.stringify({ prompt: text }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        console.log("API Response:", response.data.response);

        const result =
          typeof response?.data?.response === "string"
            ? response.data.response
            : JSON.stringify(response.data.response);

        // Convert Markdown to HTML using marked
        const formattedResponse = marked(result);

        const botResponse = { text: formattedResponse, sender: "bot" };

        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } catch (error) {
        console.error("Error fetching response:", error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "Error getting response!", sender: "bot" },
        ]);
      }

      setLoading(false);
    }
  };

  return (
    <div className="chat-window">
      <h2 className = "chat-heading">Ask AI</h2>
      <div className="message-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.sender === "user" ? "user-message" : "bot-message"
            }`}
            dangerouslySetInnerHTML={{ __html: msg.text }} // Render formatted text
          />
        ))}
        {loading && <div className="message bot-message">...</div>}
      </div>
      <div className="input-area">
        <textarea
          wrap="soft"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="input"
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
