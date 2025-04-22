document.addEventListener("DOMContentLoaded", function () {
  const chatbotRoot = document.querySelector(".ai-assistant");

  if (!chatbotRoot) {
    console.error("Chatbot root element not found!");
    return;
  }

  // Create chatbot UI
  chatbotRoot.innerHTML = `
        <div class="chat-window">
        <h4 align="center">Ask AI</h4>
            <div class="message-container" id="message-container"></div>
            <div class="input-area">
                <textarea id="user-input" class="input" placeholder="Type your message..."></textarea>
                <button id="send-button" class="send-button">Send</button>
            </div>
        </div>
    `;

  const messageContainer = document.getElementById("message-container");
  const userInput = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");

  let messages = [{ text: "Hello! How can I help you today?", sender: "bot" }];

  function renderMessages() {
    messageContainer.innerHTML = "";
    messages.forEach((msg) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${
        msg.sender === "user" ? "user-message" : "bot-message"
      }`;
      messageDiv.innerHTML = msg.text;
      messageContainer.appendChild(messageDiv);
    });

    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  function sendMessage() {
    const text = userInput.value.trim();
    if (!text) return;

    messages.push({ text, sender: "user" });
    renderMessages();
    userInput.value = "";

    // Simulate bot response
    setTimeout(() => {
      fetchBotResponse(text);
    }, 500);
  }

  async function fetchBotResponse(userMessage) {
    try {
      const response = await fetch("http://localhost:3500/generateResponse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });

      const data = await response.json();
      const botText = data.response || "Sorry, I didn't understand that.";
      let specialist;
      if (data.response) {
          specialist = botText.split("Specialist:")[1]?.trim().toLowerCase(); // Extract and trim specialization
          console.log("Specialist:", specialist);
      
          if (specialist) {
              fetchDoctorsBySpecialization(specialist); // Fetch doctors
          }
      }
      
      // Function to fetch doctors based on specialization
      async function fetchDoctorsBySpecialization(specialization) {
          try {
              const response = await fetch(`/get-doctors?specialization=${encodeURIComponent(specialization)}`);
              const doctors = await response.json();
              displayDoctors(doctors); // Call function to display
          } catch (error) {
              console.error("Error fetching doctors:", error);
          }
      }
      
      // Function to display doctors in the doctor list
     // Function to display doctors in the doctor list
function displayDoctors(doctors) {
  const doctorList = document.querySelector(".doctor-list"); // Target doctor list container

  if (!doctors.length) {
      doctorList.innerHTML = "<p>No doctors found</p>"; // Handle empty case
      return;
  }

  doctorList.innerHTML = ""; // Clear previous data

  doctors.forEach((doctor) => {
      // Set constant rating
      const rating = "3.5";
      const reviewCount = "120"; // Fixed review count
      const availability = Math.random() > 0.5 ? "Available Today" : "Available Tomorrow"; // Random availability

      // Create doctor card
      const doctorCard = document.createElement("div");
      doctorCard.classList.add("doctor-card");

      doctorCard.innerHTML = `
          <img src="https://www.shutterstock.com/image-vector/doctor-icon-design-template-vector-600nw-1343960477.jpg" 
               alt="${doctor.username}" class="doctor-avatar" />
          <div class="doctor-info">
              <h4>Dr. ${doctor.username}</h4>
              <p>${doctor.specialization}</p>
              <div class="rating">
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star-half-stroke"></i>
                  <i class="fa-regular fa-star"></i>
                  <span>${rating} (${reviewCount})</span>
              </div>
              <div class="availability">${availability}</div>
              <button class="btn btn-primary" onclick="bookDoctor()">Contact</button>
          </div>
      `;

      doctorList.appendChild(doctorCard); // Append doctor card
  });
}

      
      


      messages.push({ text: botText, sender: "bot" });
    } catch (error) {
      console.error("Error fetching response:", error);
      messages.push({ text: "Error getting response!", sender: "bot" });
    }

    renderMessages();
  }

  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });

  renderMessages();
});

function bookDoctor() {
  window.location.href = `/chat`; // Redirect to the chat page
}
