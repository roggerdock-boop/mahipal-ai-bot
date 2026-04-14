const express = require('express');
const mongoose = require('mongoose');
const Groq = require("groq-sdk");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

// 1. Groq Setup
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 2. MongoDB Connection
console.log("Attempting to connect to Database...");
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ ✅ ✅ DATABASE CONNECTED SUCCESSFULLY!"))
  .catch(err => console.log("❌ ❌ ❌ DATABASE CONNECTION ERROR:", err.message));

// 3. User Schema (Memory System)
const userSchema = new mongoose.Schema({
    userId: { type: String, default: "default_user" },
    name: { type: String, default: "Dost" },
    interests: [String],
    chatHistory: [{ 
        role: String, 
        content: String 
    }]
});
const User = mongoose.model('User', userSchema);

// 4. Chat Route
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const userId = "default_user"; // Abhi ke liye common user

        // Database se user memory nikalna
        let userData = await User.findOne({ userId });
        if (!userData) {
            userData = new User({ userId });
        }

        // --- ML LEARNING LOGIC ---
        const userMsgLower = message.toLowerCase();
        if (userMsgLower.includes("mera naam")) {
            const parts = message.split(/naam/i);
            if(parts[1]) userData.name = parts[1].replace(/[.!]/g, '').trim();
        }
        if (userMsgLower.includes("cement") || userMsgLower.includes("vrm")) {
            if(!userData.interests.includes("Cement Industry")) userData.interests.push("Cement Industry");
        }

        // --- CLEANING HISTORY (Fixing the 400 Error) ---
        // Groq ko sirf 'role' aur 'content' chahiye, MongoDB ki '_id' nahi.
        const cleanedHistory = userData.chatHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        // 5. AI Prompt with Context
        const systemPrompt = `Tumhara naam Empire AI hai, jise Mahipal ne banaya hai. 
        User ka naam ${userData.name} hai. Unka interest ${userData.interests.join(", ") || "seekhne"} mein hai.
        Tumhe sarcasm samajh aata hai aur tum multi-lingual ho. Desi aur witty andaaz mein baat karo.`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...cleanedHistory.slice(-10), // Pichli 10 baatein
            { role: "user", content: message }
        ];

        // 6. Groq API Call
        const completion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
        });

        const reply = completion.choices[0].message.content;

        // 7. Memory Save Karna
        userData.chatHistory.push({ role: "user", content: message });
        userData.chatHistory.push({ role: "assistant", content: reply });
        
        // History zyada lambi na ho jaye (Max 20 messages)
        if (userData.chatHistory.length > 20) userData.chatHistory.shift();
        
        await userData.save();

        res.json({ reply });

    } catch (error) {
        console.log("❌ Chat Error:", error.message);
        res.status(500).json({ reply: "Bhai, system thoda hang ho gaya hai. Dobara koshish karo!" });
    }
});

// 8. Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Empire AI Live on Port ${PORT}`);
});