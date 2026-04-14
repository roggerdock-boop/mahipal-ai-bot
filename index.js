const express = require('express');
const path = require('path');
const Groq = require("groq-sdk");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// SMART MEMORY & ALL-ROUNDER PERSONALITY
let chatHistory = [
    { 
        role: "system", 
        content: `Tumhara naam "Empire AI" hai. Tum ek smart aur all-rounder AI assistant ho jise Mahipal ne banaya hai.
        
        RULES:
        1. User ko hamesha "Bhai" ya "Dost" keh kar baat karo.
        2. "Mahipal" tumhare Boss/Creator hain. Sirf unhe hi 'Mahipal Bhai' ya 'Boss' bolo. Dusron ko nahi.
        3. Tum har topic (Science, History, Tech, Fun) par baat kar sakte ho.
        4. Markdown (Headings, Bold, Lists) ka use karo taaki jawab sundar dikhe.` 
    }
];

app.post('/chat', async (req, res) => {
    try {
        const userMsg = req.body.message;
        
        // Chat History mein user ka message dalo
        chatHistory.push({ role: "user", content: userMsg });

        const chatCompletion = await groq.chat.completions.create({
            messages: chatHistory,
            model: "llama-3.3-70b-versatile",
            temperature: 0.7, // Thoda creative jawab ke liye
        });

        const reply = chatCompletion.choices[0].message.content;
        
        // Bot ka jawab history mein dalo
        chatHistory.push({ role: "assistant", content: reply });

        // Memory manage karne ke liye (pichli 15 baatein yaad rakhega)
        if (chatHistory.length > 15) chatHistory.splice(1, 2);

        res.json({ reply: reply });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ reply: "Bhai, AI thoda thak gaya hai, ek baar refresh karke pucho!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 All-Rounder Empire AI Live!`));