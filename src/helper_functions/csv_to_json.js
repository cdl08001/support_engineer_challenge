const csv = require('csvtojson')

const convertToCSV = async (filePath) => {
  const jsonArray = await csv().fromFile(filePath);
  console.log(jsonArray);
}

export default convertToCSV;