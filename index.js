const fs = require('fs');
const eventStream = require('event-stream');
const axios = require('axios');
require('dotenv').config();

let lineNumber = 0;

const processCSV = (file, headerPresent = false) => {
  const reader = fs
    .createReadStream(file)
    .pipe(eventStream.split())
    .pipe(
      eventStream
        .mapSync((line) => {
          lineNumber++;
          reader.pause(); // pause the readstream
          if (headerPresent) {
            reader.resume();
            headerPresent = false;
            return;
          }
          const email = line.split(',')[2];
          console.log(`Processing Email: ${email} on line # ${lineNumber} ....`);
          callCheckEmail(email, reader);
        })
        .on('error', (err) => console.log(`Error while reading file on line ${lineNumber}`, err))
        .on('end', () => console.log('Read entire file.'))
    );
};

const callCheckEmail = (Email, reader) => {
  axios({
    method: 'post',
    headers: { 'x-api-key': process.env.CCS_API_KEY },
    url: process.env.CCS_CHECK_EMAIL_URL,
    data: { Email },
  })
    .then(() => reader.resume()) // resume the readstream
    .catch((error) => console.error(error.response.data));
};

processCSV('emails.csv', true);
