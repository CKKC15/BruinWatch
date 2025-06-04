import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

class BaseScraper {
    constructor(options = {}) {
        this.axiosInstance = axios.create({
            timeout: options.timeout || 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...options.headers
            }
        });

        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        this.rateLimitDelay = options.rateLimitDelay || 1000;
        this.lastRequestTime = 0;
    }

    /**
     * Rate limiting - ensures minimum delay between requests
     */
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            await this.delay(waitTime);
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch HTML content with retry logic
     */
    async fetchHTML(url, options = {}) {
        await this.waitForRateLimit();

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                console.log(`Fetching ${url} (attempt ${attempt})`);

                const response = await this.axiosInstance.get(url, options);

                if (response.status === 200 && response.data) {
                    return response.data;
                }

                throw new Error(`HTTP ${response.status}: ${response.statusText}`);

            } catch (error) {
                console.error(`Attempt ${attempt} failed for ${url}:`, error.message);

                if (attempt === this.retryAttempts) {
                    throw new Error(`Failed to fetch ${url} after ${this.retryAttempts} attempts: ${error.message}`);
                }

                // Exponential backoff
                const delayTime = this.retryDelay * Math.pow(2, attempt - 1);
                await this.delay(delayTime);
            }
        }
    }

    /**
     * Parse HTML content using Cheerio
     */
    parseHTML(html) {
        return cheerio.load(html);
    }

    /**
     * Launch Puppeteer browser for dynamic content
     */
    async launchBrowser(options = {}) {
        return await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            ...options
        });
    }

    /**
     * Fetch content using Puppeteer for JavaScript-heavy sites
     */
    async fetchWithPuppeteer(url, options = {}) {
        let browser;

        try {
            await this.waitForRateLimit();

            browser = await this.launchBrowser(options.browserOptions);
            const page = await browser.newPage();

            // Set viewport and user agent
            await page.setViewport({ width: 1280, height: 720 });
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Navigate to the page
            await page.goto(url, {
                waitUntil: options.waitUntil || 'networkidle2',
                timeout: options.timeout || 30000
            });

            // Wait for specific selector if provided
            if (options.waitForSelector) {
                await page.waitForSelector(options.waitForSelector, {
                    timeout: options.selectorTimeout || 10000
                });
            }

            // Get page content
            const content = await page.content();

            return content;

        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    /**
     * Clean and normalize text content
     */
    cleanText(text) {
        if (!text) return '';

        return text
            .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
            .replace(/\n\s*\n/g, '\n')  // Remove empty lines
            .trim();
    }

    /**
     * Extract numbers from text
     */
    extractNumber(text) {
        if (!text) return null;

        const match = text.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : null;
    }

    /**
     * Extract course code from text (e.g., "CS 31", "MATH 32A")
     */
    extractCourseCode(text) {
        if (!text) return null;

        const match = text.match(/([A-Z]{2,4})\s*(\d+[A-Z]*)/i);
        return match ? `${match[1].toUpperCase()} ${match[2]}` : null;
    }

    /**
     * Extract time from text (e.g., "10:00 AM", "2:30 PM")
     */
    extractTime(text) {
        if (!text) return null;

        const match = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        return match ? `${match[1]}:${match[2]} ${match[3].toUpperCase()}` : null;
    }

    /**
     * Parse days of week (e.g., "MWF", "TR")
     */
    parseDays(daysText) {
        if (!daysText) return [];

        const dayMap = {
            'M': 'M', 'TU': 'T', 'T': 'T', 'W': 'W',
            'TH': 'R', 'R': 'R', 'F': 'F', 'S': 'S', 'SU': 'U'
        };

        const days = [];
        const cleanText = daysText.replace(/\s/g, '').toUpperCase();

        // Handle common patterns
        if (cleanText.includes('MW') || cleanText.includes('MF')) {
            if (cleanText.includes('MWF')) days.push('M', 'W', 'F');
            else if (cleanText.includes('MW')) days.push('M', 'W');
        } else if (cleanText.includes('TR') || cleanText.includes('TH')) {
            days.push('T', 'R');
        } else {
            // Parse individual characters
            for (let i = 0; i < cleanText.length; i++) {
                const char = cleanText[i];
                if (dayMap[char]) days.push(dayMap[char]);
            }
        }

        return [...new Set(days)]; // Remove duplicates
    }
}

export default BaseScraper; 