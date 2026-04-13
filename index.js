const express = require('express');
const path = require('path');
const Groq = require("groq-sdk");
require('dotenv').config(); // Sabse important line

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Secure API Key (Ye .env se value uthayega)
const groq = new Groq({ 
    apiKey: process.env.GROQ_API_KEY 
}); 

let chatHistory = [
    { 
        role: "system", 
        content: "Tumhara naam gmk AI hai. Ek expert aur friendly assistant ho jo detail mein jawab deta hai." 
    }
];

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/chat', async (req, res) => {
    try {
        const userMsg = req.body.message;
        chatHistory.push({ role: "user", content: userMsg });

        const chatCompletion = await groq.chat.completions.create({
            messages: chatHistory,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 2048,
        });

        const reply = chatCompletion.choices[0].message.content;
        chatHistory.push({ role: "assistant", content: reply });

        if (chatHistory.length > 20) chatHistory.splice(1, 2);
        res.json({ reply: reply });
    } catch (error) {
        console.error("Error details:", error.message);
        res.status(500).json({ reply: "Bhai, key check kar ya server check kar: " + error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Secure Bot Live: http://localhost:${PORT}`));