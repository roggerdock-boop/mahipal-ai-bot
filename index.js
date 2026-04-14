const express = require('express');
const mongoose = require('mongoose');
const Groq = require("groq-sdk");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- DATABASE CONNECTION LOGIC ---
console.log("Attempting to connect to Database...");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ ✅ ✅ DATABASE CONNECTED SUCCESSFULLY!");
  })
  .catch(err => {
    console.log("❌ ❌ ❌ DATABASE CONNECTION ERROR:", err.message);
  });

// User Schema (Memory System)
const userSchema = new mongoose.Schema({
    userId: { type: String, default: "default_user" },
    name: { type: String, default: "Dost" },
    interests: [String],
    chatHistory: [{ role: String, content: String }]
});
const User = mongoose.model('User', userSchema);

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        const userId = "default_user"; 

        // Database se user memory nikalna
        let userData = await User.findOne({ userId });
        if (!userData) {
            userData = new User({ userId });
        }

        // AI Logic
        const messages = [
            { role: "system", content: `Tum Empire AI ho. User ka naam ${userData.name} hai. Use respect do.` },
            ...userData.chatHistory.slice(-6),
            { role: "user", content: message }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: "llama-3.3-70b-versatile",
        });

        const reply = completion.choices[0].message.content;

        // Memory Save Karna
        userData.chatHistory.push({ role: "user", content: message });
        userData.chatHistory.push({ role: "assistant", content: reply });
        await userData.save();

        res.json({ reply });
    } catch (error) {
        console.log("Chat Error:", error.message);
        res.status(500).json({ reply: "Bhai, error aa gaya!" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});