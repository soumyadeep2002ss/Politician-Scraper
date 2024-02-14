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

const translateText = async (text, sourceLanguage, targetLanguage) => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    try {
        const sourceCountry = languageMapping[sourceLanguage] || 'Unknown';
        const targetCountry = languageMapping[targetLanguage] || 'Unknown';

        // Navigate to Google Translate
        await page.goto(`https://translate.google.com/?sl=${sourceLanguage}&tl=${targetLanguage}&op=translate`, { waitUntil: 'domcontentloaded' });

        // Type the text into the input field
        await page.type('#yDmH0d > c-wiz > div > div.ToWKne > c-wiz > div.OlSOob > c-wiz > div.ccvoYb.EjH7wc > div.AxqVh > div.OPPzxe > c-wiz.rm1UF.UnxENd > span > span > div > textarea', text);

        // await page.waitForTimeout(5000);

        // Wait for translation to appear
        await page.waitForSelector('#yDmH0d > c-wiz > div > div.ToWKne > c-wiz > div.OlSOob > c-wiz > div.ccvoYb.EjH7wc > div.AxqVh > div.OPPzxe > c-wiz.sciAJc > div > div.usGWQd > div > div.lRu31 > span.HwtZe > span > span');

        // Extract the translated text
        const translatedText = await page.evaluate(() => {
            const translationElement = document.querySelector('#yDmH0d > c-wiz > div > div.ToWKne > c-wiz > div.OlSOob > c-wiz > div.ccvoYb.EjH7wc > div.AxqVh > div.OPPzxe > c-wiz.sciAJc > div > div.usGWQd > div > div.lRu31');
            return translationElement.innerText;
        });

        // console.log(`Original Text (${sourceCountry}): ${text}`);
        // console.log(`Translated Text (${targetCountry}): ${translatedText}`);
        return translatedText;
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
};

module.exports = translateText;
