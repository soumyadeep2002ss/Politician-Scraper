const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { readCSVFile } = require('./csvReader');
const fs = require('fs');
const getDataFromLinks = require('./getdatafromLinks');
const path = require('path');
const translateText = require('./translateBasedOnCountry')

puppeteer.use(StealthPlugin());


// const field_names = ["Indirizzo", "Data di nascita", "deceased date", "sesso", "languages", "citizenship", "nationality"];
const field_names = ["CV", "ONLY"];

async function run() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  // const browser1 = await puppeteer.launch({ headless: true });
  // const page1 = await browser1.newPage();
  // const Topk = 3;
  try {
    const csvFilePath = 'Politicians/sample.csv';
    const csvData = await readCSVFile(csvFilePath);

    let allResults = {};
    let startTime = Date.now();
    let x = 0;
    let checkpointIndex = readCheckpointIndex();

    function extractLinks(linkString) {
      // Split the linkString into an array of links
      const links = linkString.split('\n');

      // Use a Set to store unique links
      const uniqueLinks = new Set();

      // Iterate through the links and add them to the Set
      for (const link of links) {
        // Trim whitespace from the link
        const trimmedLink = link.trim();

        // Check if the link is not an empty string
        if (trimmedLink !== '') {
          // Add the trimmedLink to the Set
          uniqueLinks.add(trimmedLink);
        }
      }

      // Convert the Set back to an array
      const uniqueLinksArray = Array.from(uniqueLinks);

      return uniqueLinksArray;
    }

    function getFirstPos(posString) {
      // Split the linkString into an array of links
      const pos = posString.split('\n');

      // Use a Set to store unique links
      const uniquePos = new Set();

      // Iterate through the links and add them to the Set
      for (const x of pos) {
        // Trim whitespace from the link
        const trimmedPos = x.trim();

        // Check if the link is not an empty string
        if (trimmedPos !== '') {
          // Add the trimmedLink to the Set
          uniquePos.add(trimmedPos);
        }
      }

      // Convert the Set back to an array
      const uniquePosArray = Array.from(uniquePos);

      return uniquePosArray[0];
    }

    for (const { uniqueID, name: query, country, position_Description: position1, sourceLink } of csvData.slice(checkpointIndex)) {
      let position = position1;
      position = getFirstPos(position) || null;
      console.log("pos: " + position)
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


      // console.log("pos: " + position)
      if (position !== null) {
        let trPos = await translateText(page, position, 'USA', country);
        trPos = trPos !== undefined ? trPos : position;
        for (const field of field_names) {
          let translatedDob;
          let searchQuery;
          if (field === "Date of Birth1") {
            translatedDob = await translateText(page, "Date of Birth", 'USA', country);
            translatedDob = translatedDob !== undefined ? translatedDob : field;
            searchQuery = `${query} ${country} ${position} ${translatedDob}`;
            console.log(searchQuery);
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
          }
          else if (field === "Images") {
            const img_query = `${query} ${country} ${position}`;
            await page.goto(`https://www.google.com/search?q=${img_query}&tbm=isch`);
          }
          else if (field === "ONLY") {
            searchQuery = `${query} ${country} ${trPos}`;
            console.log(searchQuery);
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
          }
          else {
            searchQuery = `${query} ${country} ${trPos} ${field}`;
            console.log(searchQuery);
            await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
          }

          if (field === "Images") {
            try {
              await page.waitForSelector('.islrc img');
              const results = await page.evaluate(() => {
                const images = document.querySelectorAll('.islrc img');
                const imageSources = [];

                for (let i = 0; i < Math.min(1, images.length); i++) {
                  imageSources.push(images[i].src);
                }

                return imageSources;
              });
              console.log(results)
              const filteredResults = results.filter(result => result !== null);

              const final_query = `${query} ${country} ${position} ${field}`;
              if (field === "Date of Birth1") {
                field_results[translatedDob] = filteredResults;
              }
              else {
                field_results[field] = filteredResults;
              }
            } catch (error) {
              console.error(`Error processing ${query}/${field}: ${error.message}`);
              continue;
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          else {
            try {
              await page.waitForSelector('h3');
              const results = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('h3'));
                return anchors.slice(0, 2).map(anchor => anchor.parentElement.href || null);
              });
              console.log(results)
              const filteredResults = results.filter(result => result !== null);

              const final_query = `${query} ${country} ${position} ${field}`;
              // filteredResults.push(sourceLink);
              if (field === "Date of Birth1") {
                field_results[translatedDob] = filteredResults;
              }
              else {
                field_results[field] = filteredResults;
                field_results["SourceURL"] = extractLinks(sourceLink);
              }
            } catch (error) {
              console.error(`Error processing ${query}/${field}: ${error.message}`);
              continue;
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      else {
        field_results["SourceURL"] = extractLinks(sourceLink);
      }

      allResults[uniqueID] = field_results;

      const folderName = 'All_Links_Output';
      const filePath = path.join(folderName, `${uniqueID}_res.json`);

      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }

      fs.writeFileSync(filePath, JSON.stringify({ [uniqueID]: field_results }, null, 2, 'utf8'));

      checkpointIndex = x;
      writeCheckpointIndex(checkpointIndex);

      process.stdout.write(` - Checkpoint Index: ${checkpointIndex}`);
    }

    const totalTimeTaken = (Date.now() - startTime) / 1000;
    console.log(`\nTotal Time Taken: ${formatTime(totalTimeTaken)}`);

    const allResultsJson = JSON.stringify(allResults, null, 2);
    fs.writeFileSync('all_search_results.json', allResultsJson, 'utf8');

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
    fs.writeFileSync(checkpointIndexFile, index.toString(), 'utf8');
  } catch (error) {
    console.error('Error writing checkpoint index:', error.message);
  }
}

run();
