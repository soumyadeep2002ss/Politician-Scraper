// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const fs = require('fs');
// puppeteer.use(StealthPlugin());

// async function run() {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   const queries = ['Michele Jennings', 'Juan Lucas Restrepo', 'Simonetta Cheli'];

//   let allResults = {};

//   for (const query of queries) {
//     await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);

//     // Wait for the results page to load
//     await page.waitForSelector('h3');

//     // Extract the top 10 results
//     const results = await page.evaluate(() => {
//       const anchors = Array.from(document.querySelectorAll('h3'));
//       return anchors.slice(0, 10).map(anchor => {
//         const url = anchor.parentElement.href;
//         return url;
//       });
//     });

//     // Display the results for the current query
//     console.log(`Top 10 Google Search Results for "${query}":`);
//     results.forEach((result, index) => {
//       console.log(`${index + 1}. ${result}`);
//     });

//     // Save the results for the current query in the object
//     allResults[query] = results;

//     // Wait for a short duration between queries
//     await new Promise(resolve => setTimeout(resolve, 2000));
//   }

//   // Save all results as JSON
//   const allResultsJson = JSON.stringify(allResults, null, 2);
//   fs.writeFileSync('all_search_results.json', allResultsJson);

//   await browser.close();
// }

// run();


const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { readCSVFile } = require('./csvReader'); // Importing the CSV reader
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Read data from the CSV file
    const csvFilePath = 'sample.csv'; // Replace with your actual CSV file path
    const csvData = await readCSVFile(csvFilePath);
    console.log(csvData);
    // Use the data from the CSV to perform Google searches
    let allResults = {};

    for (const { name: query, country: country, position_Description: position } of csvData) {
      const searchQuery = `${query} ${country} ${position}`;
      await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);

      // Wait for the results page to load
      await page.waitForSelector('h3');

      // Extract the top 10 results
      const results = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('h3'));
        return anchors.slice(0, 10).map(anchor => {
          const url = anchor.parentElement.href;
          return url !== 'null' ? url : null; // Exclude null values
        });
      });

      // Filter out null values
      const filteredResults = results.filter(result => result !== null);

      // Display the results for the current query
      console.log(`Top 10 Google Search Results for "${query}":`);
      filteredResults.forEach((result, index) => {
        console.log(`${index + 1}. ${result}`);
      });

      // Save the results for the current query in the object
      allResults[query] = filteredResults;

      // Wait for a short duration between queries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Save all results as JSON
    const allResultsJson = JSON.stringify(allResults, null, 2);
    fs.writeFileSync('all_search_results.json', allResultsJson);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

run();