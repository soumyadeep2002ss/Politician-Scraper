// const puppeteer = require('puppeteer-extra');
// const { Cluster } = require('puppeteer-cluster'); // Added puppeteer-cluster import
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const { readCSVFile } = require('./csvReader');
// const fs = require('fs');
// const getDataFromLinks = require('./getdatafromLinks');

// puppeteer.use(StealthPlugin());

// var k = 3;
// const field_names = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"];

// async function run() {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   try {
//     // Read data from the CSV file
//     const csvFilePath = 'sample.csv'; // Replace with your actual CSV file path
//     const csvData = await readCSVFile(csvFilePath);
//     console.log(csvData);

//     // Use the data from the CSV to perform Google searches
//     let allResults = {};

//     const cluster = await Cluster.launch({
//       concurrency: Cluster.CONCURRENCY_CONTEXT,
//       maxConcurrency: 8,
//     });

//     await cluster.task(async ({ page, data: { query, country, position, field } }) => {
//       const searchQuery = `${query} ${country} ${position} ${field}`;
//       await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);

//       // Wait for the results page to load
//       await page.waitForSelector('h3');

//       // Extract the top k results
//       const results = await page.evaluate(() => {
//         const anchors = Array.from(document.querySelectorAll('h3'));
//         return anchors.slice(0, 3).map(anchor => {
//           const url = anchor.parentElement.href;
//           return url !== 'null' ? url : null; // Exclude null values
//         });
//       });

//       // Filter out null values
//       const filteredResults = results.filter(result => result !== null);

//       const final_query = `${query} ${country} ${position} ${field}`;
//       // Display the results for the current query
//       console.log(final_query)
//       console.log(`Top ${k} Google Search Results for "${final_query}":`);
//       filteredResults.forEach((result, index) => {
//         console.log(`${index + 1}. ${result}`);
//       });

//       const fieldResults = { [field]: filteredResults };
//       cluster.emit('fieldResults', { query, country, position, fieldResults });
//     });

//     cluster.on('fieldResults', ({ query, country, position, fieldResults }) => {
//       if (!allResults[`${query} ${country} ${position}`]) {
//         allResults[`${query} ${country} ${position}`] = {};
//       }
//       Object.assign(allResults[`${query} ${country} ${position}`], fieldResults);
//     });

//     for (const { name: query, country, position_Description: position } of csvData) {
//       for (const field of field_names) {
//         cluster.queue({ page, query, country, position, field });
//       }
//     }

//     await cluster.idle();
//     await cluster.close();

//     // Save all results as JSON
//     const allResultsJson = JSON.stringify(allResults, null, 2);
//     fs.writeFileSync('all_search_results.json', allResultsJson);

//     await runGetDataFromLinks();
//   } catch (error) {
//     console.error('Error:', error.message);
//   } finally {
//     await browser.close();
//   }
// }

// async function runGetDataFromLinks() {
//   // Your code for the other module here
//   console.log('Starting the getDataFromLinks.js module...');
//   await getDataFromLinks();
// }

// run();


// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const { readCSVFile } = require('./csvReader'); // Importing the CSV reader
// const fs = require('fs');
// const getDataFromLinks = require('./getdatafromLinks');

// puppeteer.use(StealthPlugin());

// var k = 3;
// const field_names = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"];

// async function run() {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();

//   try {
//     // Read data from the CSV file
//     const csvFilePath = 'sample.csv'; // Replace with your actual CSV file path
//     const csvData = await readCSVFile(csvFilePath);
//     // console.log(csvData);
//     // Use the data from the CSV to perform Google searches
//     let allResults = {};
//     let x=0;
//     for (const { uniqueID: uniqueID, name: query, country: country, position_Description: position } of csvData) {
//       const currentProgress = x + 1;
//       const remainingProgress = csvData.length - currentProgress;
//       process.stdout.write(`\rProgress: ${currentProgress}/${csvData.length}, Remaining: ${remainingProgress}`);
//       x++;
//       let field_results = {};
//       for(const field of field_names){  
//         const searchQuery = `${query} ${country} ${position} ${field}`;
//         await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);

//         // Wait for the results page to load
//         await page.waitForSelector('h3');

//         // Extract the top k results
//         const results = await page.evaluate(() => {
//           const anchors = Array.from(document.querySelectorAll('h3'));
//           return anchors.slice(0, 3).map(anchor => {
//             const url = anchor.parentElement.href;
//             return url !== 'null' ? url : null; // Exclude null values
//           });
//         });

//         // Filter out null values
//         const filteredResults = results.filter(result => result !== null);

//         const final_query = query+" "+country+" "+position+" "+field;
//         // Display the results for the current query
//         // console.log(`Top ${k} Google Search Results for "${final_query}":`);
//         filteredResults.forEach((result, index) => {
//           // console.log(`${index + 1}. ${result}`);
//         });

//         field_results[field] = filteredResults;
//         // Wait for a short duration between queries
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }
//       allResults[uniqueID]=field_results;
//     }

//     // Save all results as JSON
//     const allResultsJson = JSON.stringify(allResults, null, 2);
//     fs.writeFileSync('all_search_results.json', allResultsJson);
//     await runGetDataFromLinks();
//   } catch (error) {
//     console.error('Error:', error.message);
//   } finally {
//     await browser.close();
//   }
// }

// async function runGetDataFromLinks() {
//   // Your code for the other module here
//   console.log('Starting the getDataFromLinks.js module...');
//   await getDataFromLinks();
// }

// run();

// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const { readCSVFile } = require('./csvReader'); // Importing the CSV reader
// const fs = require('fs');
// const getDataFromLinks = require('./getdatafromLinks');

// puppeteer.use(StealthPlugin());

// const k = 3;
// const field_names = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"];

// async function run() {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();

//   try {
//     // Read data from the CSV file
//     const csvFilePath = 'sample.csv'; // Replace with your actual CSV file path
//     const csvData = await readCSVFile(csvFilePath);

//     let x = 0;
//     let totalElapsedTime = 0;

//     for (const { uniqueID, name: query, country, position_Description: position } of csvData) {
//       const currentProgress = x + 1;
//       const remainingProgress = csvData.length - currentProgress;
//       process.stdout.write(`\rProgress: ${currentProgress}/${csvData.length}, Remaining: ${remainingProgress}`);

//       const startTime = new Date();
//       let field_results = {};

//       for (const field of field_names) {
//         const searchQuery = `${query} ${country} ${position} ${field}`;
//         await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
//         await page.waitForSelector('h3');

//         const results = await page.evaluate(() => {
//           const anchors = Array.from(document.querySelectorAll('h3'));
//           return anchors.slice(0, 3).map(anchor => {
//             const url = anchor.parentElement.href;
//             return url !== 'null' ? url : null;
//           });
//         });

//         const filteredResults = results.filter(result => result !== null);
//         field_results[field] = filteredResults;

//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }

//       const elapsedTime = (new Date() - startTime) / 1000; // in seconds
//       totalElapsedTime += elapsedTime;

//       const averageTimePerIteration = totalElapsedTime / currentProgress;
//       const estimatedRemainingTime = averageTimePerIteration * remainingProgress;

//       console.log(` - Elapsed Time: ${formatTime(elapsedTime)}, Estimated Remaining Time: ${formatTime(estimatedRemainingTime)}`);

//       x++;
//     }

//     const allResultsJson = JSON.stringify(allResults, null, 2);
//     fs.writeFileSync('all_search_results.json', allResultsJson);
//     await runGetDataFromLinks();
//   } catch (error) {
//     console.error('Error:', error.message);
//   } finally {
//     await browser.close();
//   }
// }

// function formatTime(seconds) {
//   const minutes = Math.floor(seconds / 60);
//   const remainingSeconds = Math.floor(seconds % 60);
//   return `${minutes}m ${remainingSeconds}s`;
// }

// async function runGetDataFromLinks() {
//   console.log('Starting the getDataFromLinks.js module...');
//   await getDataFromLinks();
// }

// run();

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { readCSVFile } = require('./csvReader'); // Importing the CSV reader
const fs = require('fs');
const getDataFromLinks = require('./getdatafromLinks');

puppeteer.use(StealthPlugin());

var k = 3;
const field_names = ["address", "dob", "deceased date", "sex", "languages", "citizenship", "nationality", "occupation"];

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Read data from the CSV file
    const csvFilePath = 'sample.csv'; // Replace with your actual CSV file path
    const csvData = await readCSVFile(csvFilePath);
    // console.log(csvData);
    // Use the data from the CSV to perform Google searches
    let allResults = {};
    let startTime = Date.now(); // Track start time
    let x = 0;

    // process.stdout.write('\rCalculating estimated time...');

    for (const { uniqueID: uniqueID, name: query, country: country, position_Description: position } of csvData) {
      const currentProgress = x + 1;
      const remainingProgress = csvData.length - currentProgress;

      process.stdout.write(`\rProgress: ${currentProgress}/${csvData.length}, Remaining: ${remainingProgress}`);

      // Calculate estimated time
      const elapsedTime = (Date.now() - startTime) / 1000; // elapsed time in seconds
      const estimatedTimeRemaining = (elapsedTime / currentProgress) * remainingProgress;
      if (currentProgress === 1) {
        process.stdout.write(` - Estimated Time Remaining: 99:99:99`);
      }
      else {
        process.stdout.write(` - Estimated Time Remaining: ${formatTime(estimatedTimeRemaining)}`);
      }
      x++;
      let field_results = {};
      for (const field of field_names) {
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

        const final_query = query + " " + country + " " + position + " " + field;
        // Display the results for the current query
        // console.log(`Top ${k} Google Search Results for "${final_query}":`);
        filteredResults.forEach((result, index) => {
          // console.log(`${index + 1}. ${result}`);
        });

        field_results[field] = filteredResults;
        // Wait for a short duration between queries
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      allResults[uniqueID] = field_results;

      // Print estimated time
      // process.stdout.write(` - Estimated Time Remaining: ${formatTime(estimatedTimeRemaining)}`);
    }

    const totalTimeTaken = (Date.now() - startTime) / 1000;
    console.log(`\nTotal Time Taken: ${formatTime(totalTimeTaken)}`);

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
  console.log('\nStarting the getDataFromLinks.js module...');
  await getDataFromLinks();
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

run();
