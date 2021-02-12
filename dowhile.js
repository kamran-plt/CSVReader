const fs = require('fs');
const csv = require('fast-csv');
const axios = require('axios');
const glob = require('fast-glob');
require('dotenv').config();
const logger = require('./logger/logger');

const csvProcessor = async () => {
  let files = await glob(['./emails/*.csv'], { dot: true });

  do {
    const randomFile = files[Math.floor(Math.random() * files.length)]; //pick random from files

    if (fs.existsSync(`${randomFile}`)) {
      let data = await getFileContents(randomFile);
      let fileError = false;
      for (const row of data) {
        try {
          await migrateGuestEmail(row[2], randomFile);
        } catch (error) {
          logger.error(`Error with file: ${randomFile}- CustomerId: ${row[0]} - Response data: ${error.message}`);
          fileError = true;
          break;
        }
      }
      moveFile(randomFile, fileError ? 'errored' : 'processed');
    }
    files = await glob(['./emails/*.csv'], { dot: true });
  } while (files.length);
};

async function getFileContents(filepath) {
  const data = [];
  return new Promise(function (resolve, reject) {
    fs.createReadStream(filepath)
      .pipe(csv.parse({ headers: false }))
      .on('error', (error) => reject(error))
      .on('data', (row) => data.push(row))
      .on('end', () => {
        resolve(data);
      });
  });
}

const migrateGuestEmail = async (Email, file) => {
  return await axios({
    method: 'post',
    headers: { 'x-api-key': process.env.CCS_API_KEY },
    url: process.env.CCS_CHECK_EMAIL_URL,
    data: { Email },
  });
};

const moveFile = (file, destination) => {
  const fileName = file.split('/')[2];
  return fs.rename(file, `${destination}/${fileName}`, (err) => {
    if (err) logger.error(err);
    else {
      logger.info(`Moved file: ${file} into ${destination} folder`);
    }
  });
};

csvProcessor().catch((error) => logger.error(error));
