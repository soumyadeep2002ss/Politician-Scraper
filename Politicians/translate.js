const puppeteer = require('puppeteer');

const languageMapping = {
    'en': 'English',
    'auto': 'Automatic', // 'auto' is used for automatic language detection
    'it': 'Italian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh-CN': 'Chinese (Simplified)',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'pl': 'Polish',
    'id': 'Indonesian',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'fi': 'Finnish',
    'el': 'Greek',
    'bn': 'Bengali'
    // Add more language mappings as needed
};

const translateText = async (page, text, sourceLanguage, targetLanguage) => {
    // const browser = await puppeteer.launch({ headless: false });
    // const page = await browser.newPage();

    try {
        const sourceCountry = languageMapping[sourceLanguage] || 'Unknown';
        const targetCountry = languageMapping[targetLanguage] || 'Unknown';

        // Encode the text for the URL
        const urlEncodedText = encodeURIComponent(text);

        // If the text length is greater than 5000 characters, break it into chunks
        const chunkSize = 5000;
        const chunks = [];
        for (let i = 0; i < urlEncodedText.length; i += chunkSize) {
            chunks.push(urlEncodedText.slice(i, i + chunkSize));
        }

        // Array to store translated chunks
        const translatedChunks = [];

        // Iterate through chunks and translate
        for (const chunk of chunks) {
            // Navigate to Google Translate with the encoded chunk
            await page.goto(`https://translate.google.com/?sl=${sourceLanguage}&tl=${targetLanguage}&text=${chunk}`, { waitUntil: 'domcontentloaded' });

            // Wait for translation to appear
            await page.waitForSelector('#yDmH0d > c-wiz > div > div.ToWKne > c-wiz > div.OlSOob > c-wiz > div.ccvoYb.EjH7wc > div.AxqVh > div.OPPzxe > c-wiz.sciAJc > div > div.usGWQd > div > div.lRu31 > span.HwtZe > span > span');

            // Extract the translated text
            const translatedChunk = await page.evaluate(() => {
                const translationElement = document.querySelector('#yDmH0d > c-wiz > div > div.ToWKne > c-wiz > div.OlSOob > c-wiz > div.ccvoYb.EjH7wc > div.AxqVh > div.OPPzxe > c-wiz.sciAJc > div > div.usGWQd > div > div.lRu31');
                return translationElement.innerText;
            });

            translatedChunks.push(translatedChunk);
        }

        // Combine translated chunks
        const translatedText = translatedChunks.join('');

        // console.log(`Original Text (${sourceCountry}): ${text}`);
        // console.log(`Translated Text (${targetCountry}): ${translatedText}`);
        return translatedText;
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // await browser.close();
    }
};

module.exports = translateText;
