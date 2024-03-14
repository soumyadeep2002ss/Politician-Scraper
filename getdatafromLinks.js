const puppeteer = require('puppeteer');
const fs = require('fs');
const util = require('util');
const axios = require('axios');
const pdf = require('pdf-parse');

const readFileAsync = util.promisify(fs.readFile);
const translateText = require('./translate')

async function getDataFromLinks() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const browser1 = await puppeteer.launch({ headless: true });
  const page1 = await browser1.newPage();
  // Load the JSON file
  const jsonData = fs.readFileSync('all_search_results.json', 'utf8');
  const linksData = JSON.parse(jsonData);

  // Function to open a page, wait for page load, extract text, and save it to a file
  const scrapeAndSave = async (url, fileName, outputDirectory, i) => {
    try {
      let pdfData;
      let textContent;
      // Check if the URL ends with '.pdf'
      if (url.toLowerCase().endsWith('pdf')) {
        // If it's a direct link to a PDF, download it using axios
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            // Add any other required headers here
          },
        });
        pdfData = response.data;
      } else {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Check if the page contains a PDF
        const isPDF = await page.evaluate(() => document.contentType === 'application/pdf');
        if (isPDF) {
          // If the page is a PDF, download it
          pdfData = await page.pdf({ format: 'A4' });
        }
      }

      if (pdfData) {
        // Read text content from the downloaded PDF using pdf-parse
        const data = await pdf(pdfData, { max: 3 });
        // console.log(data.text);
        // Save text content to the specified file
        let textdata = data.text;
        if (textdata.trim() === '' && fileName.includes("CV")) {
          // console.log(url);
          const storeUrl = {
            url
          }
          fs.writeFileSync(`${outputDirectory}/nonReadableCv${i + 1}.json`, JSON.stringify(storeUrl, null, 2), 'utf8');
        }
        if (textdata.trim() !== '') {
          textdata = data.text;
        }
        fs.writeFileSync(fileName, textdata, 'utf8');
        console.log(fileName)
      } else {
        // If it's not a PDF, extract text content directly
        textContent = await page.evaluate(() => document.body.innerText);
        // console.log(textContent)
        if (textContent.trim() !== '') {
          textContent =  textContent;
        }
        fs.writeFileSync(fileName, textContent, 'utf8');
      }
    } catch (error) {
      throw new Error(`Error processing ${url}: ${error.message}`);
    }
  };

  // Get total number of queries
  const totalQueries = Object.keys(linksData).length;
  let completedQueries = 0;

  // Iterate through each query and its associated links
  for (const [query, fields] of Object.entries(linksData)) {
    const totalLinks = Object.values(fields).flat().filter(link => link).length;
    let completedLinks = 0;

    // Track processed links for the current query
    const processedLinks = new Set();

    // Log remaining queries and current query
    const remainingQueries = totalQueries - completedQueries;
    console.log(`Remaining Queries: ${remainingQueries}, Current Query: ${query}`);
    for (const [field, links] of Object.entries(fields)) {
      const outputDirectory = `Output/${query}/${field}`;

      // Check if the "Output" directory exists, create it if not
      if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
      }

      // Iterate through each link and open/save the text content
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        if (link && !processedLinks.has(link)) {
          const fileName = `${outputDirectory}/result_${i + 1}.txt`;
          try {
            if (!link.toLowerCase().endsWith('jpg') &&
              !link.toLowerCase().endsWith('mp4') &&
              !link.toLowerCase().endsWith('mp3') &&
              !link.toLowerCase().endsWith('png') &&
              !link.toLowerCase().endsWith('gif')) {
              await scrapeAndSave(link, fileName, outputDirectory, i);
            }

            // console.log(`Saved text content for ${query}/${field} - Result ${i + 1}`);

            // Increment completedLinks count
            completedLinks += 1;

            // Add the processed link to the set
            processedLinks.add(link);
          } catch (error) {
            console.error(`Error processing ${query}/${field} - Result ${i + 1}: ${error.message}`);
          }

          // Calculate and display progress
          const progress = (completedLinks / totalLinks) * 100;
          process.stdout.write(`\rProgress for ${query}: ${progress.toFixed(2)}%`);

          // Wait for a short duration between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }


    // Increment completedQueries count
    completedQueries += 1;

    // Wait for a short duration between queries
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log('\nData extraction completed!');
  await browser.close();
  await browser1.close();
}

module.exports = getDataFromLinks;
// getDataFromLinks();
