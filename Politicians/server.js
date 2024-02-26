const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const csvReader = require('./csvReader'); // Assuming the csvReader module is in the same directory
const run = require('.');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let browser;
let page;
async function startBrowser() {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
}
startBrowser();
// Set up WebSocket heartbeat
const heartbeatInterval = 30000; // 30 seconds

wss.on('connection', (ws) => {
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });
});

// const interval = setInterval(() => {
//     // Dummy process: Send a message to all connected WebSocket clients every 2 seconds
//     wss.clients.forEach((client) => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(JSON.stringify({ message: 'Dummy process executed.' }));
//         }
//     });
// }, 5000); // 5 seconds

// Set up file upload using Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Your scraping function
const runScraping = async (csvBuffer) => {
    try {
        const csvData = await csvReader.readCSVBuffer(csvBuffer);
        // Your scraping logic using csvData
        console.log('Scraping function triggered with CSV data:', csvData);

        // Example: Sending the parsed CSV data as a JSON response via WebSocket
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ success: true, csvData }));
            }
        });
    } catch (error) {
        console.error('Error in runScraping:', error.message);
        throw error; // Propagate the error to handle it in the API endpoint
    }
};

// API endpoint to trigger scraping
app.post('/scrape', upload.single('csvFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'CSV file is required.' });
        }

        const csvBuffer = req.file.buffer;
        res.status(200).json({ success: true, message: 'Scraping started successfully.' });
        await run(csvBuffer, wss, WebSocket, browser, page);

    } catch (error) {
        console.error('Error in /scrape endpoint:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
