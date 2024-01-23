const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Load the JSON file
  const jsonData = fs.readFileSync('all_search_results.json', 'utf8');
  const linksData = JSON.parse(jsonData);

  // Function to open a page, wait for page load, extract text, and save it to a file
  const scrapeAndSave = async (url, fileName) => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const textContent = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(fileName, textContent);
  };

  // Iterate through each query and its associated links
  for (const [query, links] of Object.entries(linksData)) {
    const outputDirectory = `Output/${query}`;

    // Check if the "Output" directory exists, create it if not
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    // Iterate through each link and open/save the text content
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link) {
        const fileName = `${outputDirectory}/result_${i + 1}.txt`;
        try {
          await scrapeAndSave(link, fileName);
          console.log(`Saved text content for ${query} - Result ${i + 1}`);
        } catch (error) {
          console.error(`Error processing ${query} - Result ${i + 1}: ${error.message}`);
        }

        // Display progress
        const progress = ((i + 1) / links.length) * 100;
        console.log(`Progress for ${query}: ${progress.toFixed(2)}%`);

        // Wait for a short duration between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  await browser.close();
}

run();
