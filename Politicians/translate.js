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

        console.log(`Original Text (${sourceCountry}): ${text}`);
        console.log(`Translated Text (${targetCountry}): ${translatedText}`);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await browser.close();
    }
};

// Example usage:
translateText(`Tommaso Amodeo
Dati personali
Data e luogo di nascita: 25 Maggio 1966, Roma
Città di residenza: Roma
email: info@tommasoamodeo.it
Facebook: Tommaso Amodeo @tommaso-amodeo
Instagram: @tommaso_amodeo
https://www.instagram.com/tommaso_amodeo/
URL sito:
www.tommasoamodeo.it
Esperienze lavorative
● dal 1993 al 1995 – Ancitel S.p.A.
Società di servizi dell’ANCI (Associazione nazionale comuni italiani).
Ricercatore di banca dati, responsabile commerciale
Ancitel era in quegli anni una brillante società all’avanguardia tecnologica, che erogava servizi di
vario genere ai comuni sia in modalità telematica che in modalità cartacea. Ho acquisito
esperienza sul mondo degli Enti Locali e sul loro funzionamento. Ho maturato le prime esperienze
di marketing e di vendita.
● dal 1996 al 2013 – Gruppo Engineering
Società di ingegneria informatica.
Dopo un breve apprendistato tecnico, sono stato avviato alla carriera commerciale, e ho ricoperto
mansioni di importanza crescente. Al momento delle dimissioni, ero consigliere di amministrazione
e Vicepresidente, con delega alle attività internazionali, della capogruppo Engineering Ingegneria
Informatica S.p.A., nonché amministratore delegato di Engineering International Belgium, con sede
a Bruxelles.
L’esperienza maturata in questa azienda è stata fondamentale nella mia crescita umana e
professionale; mi ha permesso nel corso degli anni una forte responsabilizzazione lavorativa e ho
acquisito competenze manageriali e imprenditoriali, anche con proiezione internazionale. Sono stato
immmerso nell’innovazione tecnologica e ho sperimentato in prima persona quanto questa sia
fondamentale per il buon funzionamento di ogni organizzazione.
Engineering è un’importante società di ingegneria informatica`, "auto", "en");
