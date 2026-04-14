const express = require('express');
const path = require('path');
const Groq = require("groq-sdk");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- ADVANCED NLP SYSTEM PROMPT ---
let chatHistory = [
    { 
        role: "system", 
        content: `Tumhara naam "Empire AI" hai, jise Mahipal ne banaya hai.
        
        ADVANCED SKILLS:
        1. MULTI-LINGUAL: User jis bhasha mein baat kare (Hindi, English, Rajasthani, etc.), tum usi mein jawab do.
        2. SARCASM DETECTION: Agar user taana maare ya sarcasm use kare (e.g., 'Wah! Tu toh bada hoshiyaar hai'), toh use samjho aur ek witty/mazedaar jawab do.
        3. IDIOMS & COLLOQUIALISMS: "Aasman se gira khajoor mein atka" ya "Makkhan lagana" jaise muhavaron ko samjho aur unka sahi matlab nikaalo.
        
        PERSONALITY:
        - Tum robotic nahi ho. Tumhari baaton mein thoda 'Desi' touch aur 'Witty' (chatur) andaaz hona chahiye.
        - User ko "Bhai" ya "Dost" bolo. Mahipal ko "Boss" ya "Creator" bolo.
        - Markdown use karo (Headings, Bold) taaki jawab premium lage.` 
    }
];

app.post('/chat', async (req, res) => {
    try {
        const userMsg = req.body.message;
        chatHistory.push({ role: "user", content: userMsg });

        const chatCompletion = await groq.chat.completions.create({
            messages: chatHistory,
            model: "llama-3.3-70b-versatile",
            temperature: 0.8, // Thoda high rakha hai taaki sarcasm aur idioms ache se nikal kar aayein
        });

        const reply = chatCompletion.choices[0].message.content;
        chatHistory.push({ role: "assistant", content: reply });

        if (chatHistory.length > 20) chatHistory.splice(1, 2);

        res.json({ reply: reply });
    } catch (error) {
        res.status(500).json({ reply: "Bhai, dimag garam ho gaya hai AI ka. Refresh karo!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Empire AI NLP Pro Live!`));