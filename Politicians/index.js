const puppeteer = require('puppeteer-extra');
const { Cluster } = require('puppeteer-cluster'); // Added puppeteer-cluster import
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { readCSVFile } = require('./csvReader');
const fs = require('fs');
const getDataFromLinks = require('./getdatafromLinks');

puppeteer.use(StealthPlugin());

var k = 3;
const field_names = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"];

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Read data from the CSV file
    const csvFilePath = 'sample.csv'; // Replace with your actual CSV file path
    const csvData = await readCSVFile(csvFilePath);
    console.log(csvData);

    // Use the data from the CSV to perform Google searches
    let allResults = {};

    const cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_CONTEXT,
      maxConcurrency: 8,
    });

    await cluster.task(async ({ page, data: { query, country, position, field } }) => {
      const searchQuery = `${query} ${country} ${position} ${field}`;
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);

      // Wait for the results page to load
      await page.waitForSelector('h3');

      // Extract the top k results
      const results = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h3'));
        return anchors.slice(0, 3).map(anchor => {
          const url = anchor.parentElement.href;
          return url !== 'null' ? url : null; // Exclude null values
        });
      });

      // Filter out null values
      const filteredResults = results.filter(result => result !== null);

      const final_query = `${query} ${country} ${position} ${field}`;
      // Display the results for the current query
      console.log(final_query)
      console.log(`Top ${k} Google Search Results for "${final_query}":`);
      filteredResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result}`);
      });

      const fieldResults = { [field]: filteredResults };
      cluster.emit('fieldResults', { query, country, position, fieldResults });
    });

    cluster.on('fieldResults', ({ query, country, position, fieldResults }) => {
      if (!allResults[`${query} ${country} ${position}`]) {
        allResults[`${query} ${country} ${position}`] = {};
      }
      Object.assign(allResults[`${query} ${country} ${position}`], fieldResults);
    });

    for (const { name: query, country, position_Description: position } of csvData) {
      for (const field of field_names) {
        cluster.queue({ page, query, country, position, field });
      }
    }

    await cluster.idle();
    await cluster.close();

    // Save all results as JSON
    const allResultsJson = JSON.stringify(allResults, null, 2);
    fs.writeFileSync('all_search_results.json', allResultsJson);

    await runGetDataFromLinks();
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

async function runGetDataFromLinks() {
  // Your code for the other module here
  console.log('Starting the getDataFromLinks.js module...');
  await getDataFromLinks();
}

run();
