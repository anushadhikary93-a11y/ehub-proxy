const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// 1. DYNAMIC PORT: Koyeb/Render will tell the app which port to use
const PORT = process.env.PORT || 8000;

// 2. SECURITY: API Key from your Environment Variables
const API_KEY = process.env.API_KEY; 

app.use(express.json({ limit: '50mb' }));
app.use(cors());

// Health check for the hosting provider
app.get('/', (req, res) => res.send("Proxy Status: Running 🚀"));

app.post(['/v1/chat/completions', '/chat/completions'], async (req, res) => {
    console.log(`[Request] Model: ${req.body.model}`);

    try {
        const response = await axios({
            method: 'post',
            url: "https://api.electronhub.ai/v1/chat/completions",
            headers: { 
                'Authorization': `Bearer ${API_KEY}`, 
                'Content-Type': 'application/json',
                // STEALTH HEADERS: This mimics a real Chrome browser on Windows
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/event-stream, */*',
                'Referer': 'https://electronhub.ai/',
                'Origin': 'https://electronhub.ai'
            },
            data: req.body, 
            responseType: 'stream'
        });

        // Setup streaming for JanitorAI
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        response.data.pipe(res);

    } catch (error) {
        if (error.response) {
            console.error(`❌ Error Status: ${error.response.status}`);
            // Log the actual error message from eHub
            error.response.data.on('data', (chunk) => {
                console.error("Reason:", chunk.toString());
            });
        } else {
            console.error("❌ Connection Error:", error.message);
        }

        if (!res.headersSent) {
            res.status(error.response?.status || 500).json({ error: "Proxy Failed" });
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proxy active at http://0.0.0.0:${PORT}`);
});
