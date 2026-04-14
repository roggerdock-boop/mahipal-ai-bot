const express = require('express');
const path = require('path');
const Groq = require("groq-sdk");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); 

// SMART MEMORY & NEW PERSONALITY
let chatHistory = [
    { 
        role: "system", 
        content: `Tumhara naam "Empire AI" hai. Tum Mahipal ke personal assistant ho.
        RULE 1: Tum hamesha respect se baat karoge lekin 'Mardana' aur 'Heavy' awaaz wala feel doge.
        RULE 2: Tum har user ko "Mahipal bhai" nahi bologe. Agar user apna naam bataye toh uska naam lo, nahi toh sirf "Bhai" ya "Dost" bolo.
        RULE 3: Mahipal tumhara boss hai. Agar koi pucha 'Mahipal kaun hai', toh bolo 'Wo mere creator aur boss hain'.
        RULE 4: Apne answers ko format karne ke liye Markdown (Headings, Bullets) ka use karo taaki wo ChatGPT jaisa dikhe.
        RULE 5: To-the-point baat karo, bina matlab ke lambe lectures mat do jab tak pucha na jaye.` 
    }
];

app.post('/chat', async (req, res) => {
    try {
        const userMsg = req.body.message;
        chatHistory.push({ role: "user", content: userMsg });

        const chatCompletion = await groq.chat.completions.create({
            messages: chatHistory,
            model: "llama-3.3-70b-versatile",
            temperature: 0.6, // Thoda creative but stable
        });

        const reply = chatCompletion.choices[0].message.content;
        chatHistory.push({ role: "assistant", content: reply });

        // Memory Limit
        if (chatHistory.length > 15) chatHistory.splice(1, 2);

        res.json({ reply: reply });
    } catch (error) {
        res.status(500).json({ reply: "Bhai, Error aa gaya: " + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Empire AI Live on Port ${PORT}`));