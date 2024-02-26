const csv = require('csv-parser');
const { Readable } = require('stream');

function readCSVBuffer(csvBuffer) {
  return new Promise((resolve, reject) => {
    const jsonData = [];
    const result = {};
    console.log(csvBuffer)
    const readableStream = new Readable();
    readableStream._read = () => { }; // Needed for the stream to work

    readableStream.push(csvBuffer);
    readableStream.push(null);

    readableStream
      .pipe(csv())
      .on('data', (row) => {
        const name = row['Name'];
        const country = row['Country'];
        const position_Description = row['Position_Description'];
        const uniqueID = row['UniqueId'];
        const sourceLink = row['Source_Url'];
        result[uniqueID] = { Name: name, Country: country, Position_Description: position_Description };
        jsonData.push({ uniqueID, name, country, position_Description, sourceLink });
      })
      .on('end', () => {
        resolve(jsonData);
        const resultsJson = JSON.stringify(result, null, 2);
        // You can optionally write the results to a file here if needed
        fs.writeFileSync('csv_results.json', resultsJson);
        console.log('CSV buffer successfully processed');
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

module.exports = {
  readCSVBuffer,
};
