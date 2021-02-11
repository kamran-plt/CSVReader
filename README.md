## Info:

It will read the files from the emailFiles folder, process them and move them into processedFiles folder in case of success and if failure to process it will move them into erroredFiles folder and log them as well (all logs will be in combine.log at the root but error logs will be in erroredFiles folder).

## Note:

Make sure the CSV files are in the folder emailFiles.

Need to have an env file at the root as well with the env variables eg.

`CCS_CHECK_EMAIL_URL=https://***/exist`

`CCS_API_KEY=asdfasdfsafasf`

## To run the code

Install the package first `npm install`

Run the code `npm run all`
