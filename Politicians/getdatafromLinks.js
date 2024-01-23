const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Load the JSON file
  const jsonData = fs.readFileSync('sample.json', 'utf8');
  const linksData = JSON.parse(jsonData);

  // Function to open a page, wait for page load, extract text, and save it to a file
  const scrapeAndSave = async (url, fileName) => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // You can use 'networkidle2' instead of 'domcontentloaded' for a more relaxed wait
    // await page.goto(url, { waitUntil: 'networkidle2' });

    // You can add additional wait logic based on specific elements or conditions if needed
    // await page.waitForSelector('your-selector', { timeout: 5000 });

    const textContent = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(fileName, textContent);
  };

  // Iterate through each query and its associated links
  for (const [query, links] of Object.entries(linksData)) {
    // Create a directory for each query
    fs.mkdirSync(query, { recursive: true });

    // Iterate through each link and open/save the text content
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link) {
        const fileName = `${query}/result_${i + 1}.txt`;
        try {
          await scrapeAndSave(link, fileName);
          console.log(`Saved text content for ${query} - Result ${i + 1}`);
        } catch (error) {
          console.error(`Error processing ${query} - Result ${i + 1}: ${error.message}`);
        }

        // Wait for a short duration between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  await browser.close();
}

run();
