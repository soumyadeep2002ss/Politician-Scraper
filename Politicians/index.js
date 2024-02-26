const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const csvReader = require('./csvReader');
const fs = require('fs');
const getDataFromLinks = require('./getdatafromLinks');
const path = require('path');
const translateText = require('./translateBasedOnCountry')




// const field_names = ["Indirizzo", "Data di nascita", "deceased date", "sesso", "languages", "citizenship", "nationality"];
const field_names = ["CV", "Address", "Date of Birth1", "Date of Birth", "Positions", "Nationality", "Citizenship", "Languages", "Images"];

async function run(csvBuffer, wss, WebSocket, browser, page) {
  // const browser1 = await puppeteer.launch({ headless: true });
  // const page1 = await browser1.newPage();
  // const Topk = 3;
  try {
    const csvFilePath = 'sample.csv';
    const csvData = await csvReader.readCSVBuffer(csvBuffer);

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

      const progressUpdate = {
        current: currentProgress,
        total: csvData.length,
        estimatedTimeRemaining: formatTime(estimatedTimeRemaining),
      };
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ progress: progressUpdate }));
        }
      });
      // if (currentProgress === 1) {
      //   process.stdout.write(` - Estimated Time Remaining: 99:99:99`);
      // } else {
      //   process.stdout.write(` - Estimated Time Remaining: ${formatTime(estimatedTimeRemaining)}`);
      // }

      x++;
      let field_results = {};

      // Check if the output file for this uniqueID already exists, skip if it does
      const existingFilePath = path.join('All_Links_Output', `${uniqueID}_res.json`);
      if (fs.existsSync(existingFilePath)) {
        console.log(`\nSkipping ${uniqueID} - Already processed`);
        continue;
      }
      let trPos = await translateText(page, position, 'USA', country);
      trPos = trPos !== undefined ? trPos : position;

      // console.log(trPos)
      for (const field of field_names) {
        let translatedDob;
        let searchQuery;
        if (field === "Date of Birth1") {
          translatedDob = await translateText(page, "Date of Birth", 'USA', country);
          translatedDob = translatedDob !== undefined ? translatedDob : field;
          searchQuery = `"${query}" ${country} ${position} ${translatedDob}`;
          // console.log(searchQuery);
          await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`);
        }
        else if (field === "Images") {
          const img_query = `"${query}" ${country} ${position}`;
          await page.goto(`https://www.google.com/search?q=${img_query}&tbm=isch`);
        }
        else {
          searchQuery = `"${query}" ${country} ${trPos} ${field}`;
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
            // console.error(`Error processing ${query}/${field}: ${error.message}`);
            continue;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        else {
          try {
            await page.waitForSelector('h3');
            const results = await page.evaluate(() => {
              const anchors = Array.from(document.querySelectorAll('h3'));
              return anchors.slice(0, 3).map(anchor => anchor.parentElement.href || null);
            });
            console.log(results)
            const filteredResults = results.filter(result => result !== null);

            const final_query = `${query} ${country} ${position} ${field}`;
            filteredResults.push(sourceLink);
            if (field === "Date of Birth1") {
              field_results[translatedDob] = filteredResults;
            }
            else {
              field_results[field] = filteredResults;
            }
          } catch (error) {
            // console.error(`Error processing ${query}/${field}: ${error.message}`);
            continue;
          }

          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      allResults[uniqueID] = field_results;
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ result: { uniqueID, field_results } }));
        }
      });
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
    // console.log(`\nTotal Time Taken: ${formatTime(totalTimeTaken)}`);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          finalResponse: {
            message: 'Processing completed.',
            totalTimeTaken: totalTimeTaken,
            allResults: allResults,
          },
        }));
      }
    });

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
  // await getDataFromLinks();
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

// run();

module.exports = run;