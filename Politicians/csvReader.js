// csvReader.js
const csv = require('csv-parser');
const fs = require('fs');

function readCSVFile(csvFilePath) {
  return new Promise((resolve, reject) => {
    const jsonData = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const name = row['Name'];
        const country=row['Country'];
        const position_Description = row['Position_Description'];
        // const house = row['House'];
        // const year = row['Year'];
        // const concentration = row['Concentration'];

        jsonData.push({ name,country,position_Description });
      })
      .on('end', () => {
        resolve(jsonData);
        console.log('CSV file successfully processed');
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

module.exports = {
  readCSVFile,
};