const express = require('express');
const path = require('path');
const fs = require('fs'); // JSON file padhne ke liye
const Groq = require("groq-sdk");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. SMART MEMORY & IDENTITY SETUP
let chatHistory = [
    { 
        role: "system", 
        content: `Tumhara naam "Empire AI" hai. Tum ek professional AI assistant ho jise Mahipal ne banaya hai.
        
        RULES:
        1. Kabhi bhi user ko 'Mahipal bhai' mat bolo, jab tak user khud apna naam Mahipal na bataye.
        2. Default mein user ko "Bhai" ya "Dost" keh kar baat karo.
        3. Mahipal tumhare Boss/Creator hain. Agar koi pucha 'Mahipal kaun hai', toh kaho 'Wo mere Boss aur Creator hain'.
        4. Tumhe Cement Plant (VRM, Kiln, Clinker) ka bahut acha knowledge hai.
        5. Markdown (Headings/Points) ka use karo taaki jawab ChatGPT jaisa sundar dikhe.` 
    }
];

// 2. CHAT ROUTE (HYBRID SYSTEM)
app.post('/chat', async (req, res) => {
    try {
        const userMsg = req.body.message.toLowerCase();

        // (A) Check in knowledge.json first (Free & Fast)
        if (fs.existsSync('knowledge.json')) {
            const rawData = fs.readFileSync('knowledge.json');
            const knowledge = JSON.parse(rawData);

            for (let key in knowledge) {
                if (userMsg.includes(key)) {
                    return res.json({ reply: `**(Database Info):** ${knowledge[key]}` });
                }
            }
        }

        // (B) AI Fallback (Groq)
        chatHistory.push({ role: "user", content: userMsg });

        const chatCompletion = await groq.chat.completions.create({
            messages: chatHistory,
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
        });

        const reply = chatCompletion.choices[0].message.content;
        chatHistory.push({ role: "assistant", content: reply });

        // History Limit (Memory management)
        if (chatHistory.length > 15) chatHistory.splice(1, 2);

        res.json({ reply: reply });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ reply: "Bhai, server side par kuch issue hai. Ek baar check karo!" });
    }
});

// 3. SECRET ADMIN ROUTE
app.get('/admin-mahipal-secret', (req, res) => {
    res.send("<h1>Empire AI Admin Panel</h1><p>Welcome Boss! Kal hum yahan blog update karne ka system jodeinge.</p>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Empire AI Pro Live on Port ${PORT}`));