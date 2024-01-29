// csvReader.js
const csv = require('csv-parser');
const fs = require('fs');

function readCSVFile(csvFilePath) {
  return new Promise((resolve, reject) => {
    const jsonData = [];
    const result = {};
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const name = row['Name'];
        const country=row['Country'];
        const position_Description = row['Position_Description'];
        const uniqueID = row['UniqueId'];
        // const house = row['House'];
        // const year = row['Year'];
        // const concentration = row['Concentration'];
        result[uniqueID] = {Name: name, Country: country, Position_Description: position_Description}
        jsonData.push({ uniqueID, name, country, position_Description });
      })
      .on('end', () => {
        resolve(jsonData);
        const resultsJson = JSON.stringify(result, null, 2);
        fs.writeFileSync('csv_results.json', resultsJson);
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