const socket = io();
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const callBtn = document.getElementById("call-btn");
const incomingCall = document.getElementById("incoming-call");
const acceptCall = document.getElementById("accept-call");
const rejectCall = document.getElementById("reject-call");
const videoContainer = document.getElementById("video-container");
const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const endCallBtn = document.getElementById("end-call");

let localStream;
let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function goBack() {
    window.history.back();
}
 // Send messages
sendBtn.addEventListener("click", () => {
const messageText = messageInput.value.trim();
if (messageText) {
  socket.emit("send-msg", messageText);
  displayMessage({ msg: messageText, from: socket.id }, true);
  messageInput.value = "";
}
});

// Receive messages from server
socket.on("msg-recieve", (msg) => {
if (msg.from !== socket.id) {
  displayMessage(msg, false);
}
});

// Function to display a message
function displayMessage(msg, isSentByUser) {
const messageElement = document.createElement("div");
messageElement.classList.add("chat-message", isSentByUser ? "sent" : "received");

const textElement = document.createElement("span");
textElement.classList.add("chat-text");
textElement.textContent = msg.msg;

messageElement.appendChild(textElement);
chatBox.appendChild(messageElement);

const noMessagesText = document.querySelector(".no-messages");
if (noMessagesText) {
  noMessagesText.remove();
}

chatBox.scrollTop = chatBox.scrollHeight;
}
// Request Media Stream
async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    socket.emit("call-user");
}

callBtn.addEventListener("click", startCall);

// Receiving a call
socket.on("incoming-call", () => {
    incomingCall.style.display = "block";
});

acceptCall.addEventListener("click", () => {
    incomingCall.style.display = "none";
    startCall();
    socket.emit("accept-call");
});

rejectCall.addEventListener("click", () => {
    incomingCall.style.display = "none";
});

// WebRTC Connection
socket.on("start-call", async () => {
    videoContainer.style.display = "flex";
    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer);
});

socket.on("offer", async (offer) => {
    peerConnection = new RTCPeerConnection(config);
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", answer);
});

socket.on("answer", async (answer) => {
    await peerConnection.setRemoteDescription(answer);
});

endCallBtn.addEventListener("click", () => {
    peerConnection.close();
    videoContainer.style.display = "none";
    socket.emit("end-call");
});

socket.on("end-call", () => {
    videoContainer.style.display = "none";
});