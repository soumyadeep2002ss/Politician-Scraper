const { Cluster } = require('puppeteer-cluster');
const fs = require('fs');

async function getDataFromLinks() {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 8, // You can adjust the number of parallel instances
  });

  const globalUniqueLinks = new Set(); // Global set to keep track of unique links
  const processedData = {}; // Object to store processed data

  await cluster.task(async ({ page, data: { query, field, links } }) => {
    const outputDirectory = `Output/${query}/${field}`;

    // Check if the "Output" directory exists, create it if not
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    // Use a Set to keep track of unique links for the current field
    const uniqueLinks = new Set();

    // Iterate through each link and open/save the text content
    for (const link of links) {
      if (link && !globalUniqueLinks.has(link) && !uniqueLinks.has(link)) {
        const fileName = `${outputDirectory}/result_${uniqueLinks.size + 1}.txt`;
        try {
          await page.goto(link, { waitUntil: 'domcontentloaded' });
          const textContent = await page.evaluate(() => document.body.innerText);
          fs.writeFileSync(fileName, textContent);
          console.log(`Saved text content for ${query} - Result ${uniqueLinks.size + 1}`);

          // Add the link to the global set to track uniqueness across all fields
          globalUniqueLinks.add(link);

          // Add the link to the field-specific set to track uniqueness within the field
          uniqueLinks.add(link);

          // Add processed data to the object
          if (!processedData[query]) {
            processedData[query] = {};
          }
          if (!processedData[query][field]) {
            processedData[query][field] = [];
          }
          processedData[query][field].push({ link, filePath: fileName });
        } catch (error) {
          console.error(`Error processing ${query}: ${error.message}`);
        }

        // Wait for a short duration between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  });

  // Load the JSON file
  const jsonData = fs.readFileSync('all_search_results.json', 'utf8');
  const linksData = JSON.parse(jsonData);

  // Queue tasks for each query and its associated links
  for (const [query, fields] of Object.entries(linksData)) {
    for (const [field, links] of Object.entries(fields)) {
      cluster.queue({ query, field, links });
    }
  }

  // Wait for all tasks to complete
  await cluster.idle();
  await cluster.close();

  // Save processed data to a new JSON file
  // const processedDataJson = JSON.stringify(processedData, null, 2);
  // fs.writeFileSync('processed_data.json', processedDataJson);
}

module.exports = getDataFromLinks;

// Call the function
// getDataFromLinks();
