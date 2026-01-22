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
            args: [...chromium.args, '--disable-blink-features=AutomationControlled'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        console.log('Browser launched');
        
        const page = await browser.newPage();
        console.log('New page created');
        
        // Automation-Detection umgehen
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });
        });
        
        // Viewport wie echter Browser
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Extra Headers MIT Referer
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Referer': 'https://www.google.com/',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        });
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        console.log('Browser configured with Referer');
        
        // Zufällige Verzögerung
        const randomDelay = Math.floor(Math.random() * 3000) + 2000;
        console.log(`Random delay: ${randomDelay}ms`);
        await page.waitForTimeout(randomDelay);
        
        console.log('Navigating to URL...');
        await page.goto(url, { 
            waitUntil: 'networkidle2',  // Geändert zu networkidle2
            timeout: 60000 
        });
        console.log('Initial navigation complete');
        
        // Prüfe ob "Just a moment" im HTML ist
        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        console.log('Checking for Cloudflare challenge...');
        
        if (bodyHTML.includes('Just a moment') || bodyHTML.includes('challenge-platform')) {
            console.log('Cloudflare challenge detected, waiting 15 seconds...');
            await page.waitForTimeout(15000);
            
            // Nochmal prüfen
            const bodyHTML2 = await page.evaluate(() => document.body.innerHTML);
            if (bodyHTML2.includes('Just a moment')) {
                console.log('Still showing challenge, waiting another 10 seconds...');
                await page.waitForTimeout(10000);
            }
        }
        
        // Warte auf echte Seite
        /*console.log('Waiting for actual content...');
        try {
            await page.waitForSelector('body.body-film', { timeout: 20000 });
            console.log('Content loaded successfully');
        } catch (e) {
            console.log('Selector timeout, checking page content anyway...');
        }*/
        await page.waitForTimeout(3000);
        
        console.log('Getting HTML content...');
        const html = await page.content();
        console.log('HTML retrieved, length:', html.length);
        
        // Debug: Zeige ersten Teil des HTML
        console.log('HTML preview:', html.substring(0, 200));
        
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
