const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Puppeteer Scraper API läuft! Nutze /scrape?url=DEINE_URL');
});

app.get('/scrape', async (req, res) => {
    const url = req.query.url;
    
    if (!url) {
        return res.status(400).send('URL parameter required. Example: /scrape?url=https://example.com');
    }
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // User-Agent setzen
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Kurz warten für JS-Rendering
        await page.waitForTimeout(2000);
        
        const html = await page.content();
        
        res.send(html);
    } catch (error) {
        res.status(500).send('Error: ' + error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scraper running on port ${PORT}`);
});
