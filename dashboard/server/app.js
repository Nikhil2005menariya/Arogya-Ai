const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `You are a Medical Chat Bot. Please respond to only queries related to the medical field, or casual conversation.if you are given a list of symptoms, give the possible diseases that i might have in the following format in the following format:
  1)...
  2)...
  .
  .
  
  also give a single specialist from the below list that can treat me:
  cardiology,dermatology,neurology,pediatrics,psychiatry,orthopedics,gynecology
  
  if the treatment cannot be provided by people in the above list give general as the response
  use the format:
  Speacialist:
  <specialist>
  
  DO NOT WRITE ANY  OTHER TEXT BESIDE THIS`,
});
const chat = model.startChat({
  history: [
    {
      role: "user",
      parts: [{ text: "Hello" }],
    },
    {
      role: "model",
      parts: [{ text: "Great to meet you. What would you like to know?" }],
    },
  ],
});

const app = express();
const port = 3500;

app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post("/generateResponse", async (req, res) => {
  const { prompt } = req.body;
  const response = (
    await model.generateContent(
      prompt 
    )
  ).response.text();
  res.json({ response });
});

app.listen(port, () => {
  console.log("Server running on port 3500");
});
