const express = require('express');
const puppeteerCore = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Puppeteer Scraper API läuft! Nutze /scrape?url=DEINE_URL');
});

app.get('/scrape', async (req, res) => {
    const url = req.query.url;
    
    console.log('=== NEW REQUEST ===');
    console.log('Target URL:', url);
    
    if (!url) {
        return res.status(400).send('URL parameter required. Example: /scrape?url=https://example.com');
    }
    
    let browser;
    try {
        console.log('Launching browser...');
        browser = await puppeteerCore.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        console.log('Browser launched');

        const page = await browser.newPage();

        await page.setViewport({ width: 1920, height: 1080 });

        await page.setExtraHTTPHeaders({
            'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        console.log('New page created');
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        console.log('User agent set');
        
        console.log('Navigating to URL...');
        await page.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });
        console.log('Navigation complete');
        
        console.log('Waiting 3 seconds for JS...');
        await page.waitForTimeout(3000);
        console.log('Wait complete');
        
        console.log('Getting HTML content...');
        const html = await page.content();
        console.log('HTML retrieved, length:', html.length);
        
        res.send(html);
    } catch (error) {
        console.error('ERROR OCCURRED:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).send('Error: ' + error.message);
    } finally {
        if (browser) {
            console.log('Closing browser...');
            await browser.close();
            console.log('Browser closed');
        }
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scraper running on port ${PORT}`);
});
