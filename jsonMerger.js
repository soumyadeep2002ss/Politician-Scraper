const fs = require('fs');
const path = require('path');

const mergeJsonFiles = (directoryPath, outputFileName) => {
  try {
    const files = fs.readdirSync(directoryPath);

    const allResults = {};

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      if (fs.statSync(filePath).isFile() && path.extname(filePath) === '.json') {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        // Merge the data from the current file into the allResults object
        Object.assign(allResults, jsonData);
      }
    });

    // Write the merged data to a new JSON file
    const outputPath = path.join(directoryPath, outputFileName);
    fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2), 'utf8');

    console.log(`Merged JSON files successfully. Result saved in ${outputFileName}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Example usage:
const inputDirectoryPath = 'All_Links_Output'; // Replace with your actual directory path
const outputFileName = 'allRes1.json';

mergeJsonFiles(inputDirectoryPath, outputFileName);
