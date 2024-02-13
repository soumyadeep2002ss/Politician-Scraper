// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const { readCSVFile } = require('./csvReader');
// const fs = require('fs');
// const getDataFromLinks = require('./getdatafromLinks');
// const path = require('path');

// puppeteer.use(StealthPlugin());

// const k = 3;
// const field_names = ["Indirizzo", "Data di nascita", "deceased date", "sesso", "languages", "citizenship", "nationality"];

// async function run() {
//   const browser = await puppeteer.launch({ headless: true });
//   const page = await browser.newPage();

//   try {
//     const csvFilePath = 'sample.csv';
//     const csvData = await readCSVFile(csvFilePath);

//     let allResults = {};
//     let startTime = Date.now();
//     let x = 0;
//     let checkpointIndex = 0;

//     for (const { uniqueID, name: query, country, position_Description: position, sourceLink } of csvData.slice(checkpointIndex)) {
//       const currentProgress = x + 1;
//       const remainingProgress = csvData.length - currentProgress;

//       process.stdout.write(`\rProgress: ${currentProgress}/${csvData.length}, Remaining: ${remainingProgress}`);

//       const elapsedTime = (Date.now() - startTime) / 1000;
//       const estimatedTimeRemaining = (elapsedTime / currentProgress) * remainingProgress;

//       if (currentProgress === 1) {
//         process.stdout.write(` - Estimated Time Remaining: 99:99:99`);
//       } else {
//         process.stdout.write(` - Estimated Time Remaining: ${formatTime(estimatedTimeRemaining)}`);
//       }

//       x++;
//       let field_results = {};

//       for (const field of field_names) {
//         const searchQuery = `"${query}" ${country} ${position} ${field}`;
//         await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);

//         try {
//           await page.waitForSelector('h3');
//           const results = await page.evaluate(() => {
//             const anchors = Array.from(document.querySelectorAll('h3'));
//             return anchors.slice(0, 3).map(anchor => anchor.parentElement.href || null);
//           });

//           const filteredResults = results.filter(result => result !== null);

//           const final_query = `${query} ${country} ${position} ${field}`;
//           filteredResults.push(sourceLink);
//           field_results[field] = filteredResults;
//         } catch (error) {
//           console.error(`Error processing ${query}/${field}: ${error.message}`);
//           continue;
//         }

//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }

//       allResults[uniqueID] = field_results;

//       const folderName = 'All_Links_Output';
//       const filePath = path.join(folderName, `${uniqueID}_res.json`);

//       if (!fs.existsSync(folderName)) {
//         fs.mkdirSync(folderName);
//       }

//       fs.writeFileSync(filePath, JSON.stringify({ [uniqueID]: field_results }, null, 2));

//       checkpointIndex = x; // Update the checkpoint index

//       process.stdout.write(` - Checkpoint Index: ${checkpointIndex}`);
//     }

//     const totalTimeTaken = (Date.now() - startTime) / 1000;
//     console.log(`\nTotal Time Taken: ${formatTime(totalTimeTaken)}`);

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
//   console.log('\nStarting the getDataFromLinks.js module...');
//   await getDataFromLinks();
// }

// function formatTime(seconds) {
//   const hours = Math.floor(seconds / 3600);
//   const minutes = Math.floor((seconds % 3600) / 60);
//   const remainingSeconds = Math.floor(seconds % 60);

//   return `${hours}h ${minutes}m ${remainingSeconds}s`;
// }

// run();

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { readCSVFile } = require('./csvReader');
const fs = require('fs');
const getDataFromLinks = require('./getdatafromLinks');
const path = require('path');
const translateText = require('./translate')

puppeteer.use(StealthPlugin());

const k = 4;
// const field_names = ["Indirizzo", "Data di nascita", "deceased date", "sesso", "languages", "citizenship", "nationality"];
const field_names = ["CV", "Address", "Date of birth", "Experience"];

async function run() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    const csvFilePath = 'sample.csv';
    const csvData = await readCSVFile(csvFilePath);

    let allResults = {};
    let startTime = Date.now();
    let x = 0;
    let checkpointIndex = readCheckpointIndex();

    for (const { uniqueID, name: query, country, position_Description: position, sourceLink } of csvData.slice(checkpointIndex)) {
      const currentProgress = x + 1;
      const remainingProgress = csvData.length - currentProgress;

      process.stdout.write(`\rProgress: ${currentProgress}/${csvData.length}, Remaining: ${remainingProgress}`);

      const elapsedTime = (Date.now() - startTime) / 1000;
      const estimatedTimeRemaining = (elapsedTime / currentProgress) * remainingProgress;

      if (currentProgress === 1) {
        process.stdout.write(` - Estimated Time Remaining: 99:99:99`);
      } else {
        process.stdout.write(` - Estimated Time Remaining: ${formatTime(estimatedTimeRemaining)}`);
      }

      x++;
      let field_results = {};

      // Check if the output file for this uniqueID already exists, skip if it does
      const existingFilePath = path.join('All_Links_Output', `${uniqueID}_res.json`);
      if (fs.existsSync(existingFilePath)) {
        console.log(`\nSkipping ${uniqueID} - Already processed`);
        continue;
      }
      const trPos = await translateText(position, 'en', 'it');
      for (const field of field_names) {
        const searchQuery = `${query} ${country} ${trPos} ${field}`;
        console.log(searchQuery);
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);

        try {
          await page.waitForSelector('h3');
          const results = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('h3'));
            return anchors.slice(0, 2).map(anchor => anchor.parentElement.href || null);
          });
          console.log(results)
          const filteredResults = results.filter(result => result !== null);

          const final_query = `${query} ${country} ${position} ${field}`;
          filteredResults.push(sourceLink);
          field_results[field] = filteredResults;
        } catch (error) {
          console.error(`Error processing ${query}/${field}: ${error.message}`);
          continue;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      allResults[uniqueID] = field_results;

      const folderName = 'All_Links_Output';
      const filePath = path.join(folderName, `${uniqueID}_res.json`);

      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }

      fs.writeFileSync(filePath, JSON.stringify({ [uniqueID]: field_results }, null, 2));

      checkpointIndex = x;
      writeCheckpointIndex(checkpointIndex);

      process.stdout.write(` - Checkpoint Index: ${checkpointIndex}`);
    }

    const totalTimeTaken = (Date.now() - startTime) / 1000;
    console.log(`\nTotal Time Taken: ${formatTime(totalTimeTaken)}`);

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
  console.log('\nStarting the getDataFromLinks.js module...');
  await getDataFromLinks();
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function readCheckpointIndex() {
  try {
    const checkpointIndexFile = 'checkpointIndex.txt';
    if (fs.existsSync(checkpointIndexFile)) {
      const content = fs.readFileSync(checkpointIndexFile, 'utf-8');
      return parseInt(content);
    }
    return 0;
  } catch (error) {
    console.error('Error reading checkpoint index:', error.message);
    return 0;
  }
}

function writeCheckpointIndex(index) {
  try {
    const checkpointIndexFile = 'checkpointIndex.txt';
    fs.writeFileSync(checkpointIndexFile, index.toString());
  } catch (error) {
    console.error('Error writing checkpoint index:', error.message);
  }
}

run();
