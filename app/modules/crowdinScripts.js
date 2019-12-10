#!/usr/bin/env node

//   node crowdin [command]

//   COMMANDS
//   upload              - Uploads source file to Crowdin
//   download            - Downloads translations from Crowdin

var exec = require('child_process').exec;


const uploadSources = function() {
    console.log("Extracting Strings...")
    exec("./node_modules/.bin/extract-pot --locale locale .", function(err, stdout, stderr) {
        if (err)
            console.log(err)
        else {
            console.log(stdout);
            console.log("Uploading strings to Crowdin....")
            exec("crowdin upload sources", function(err, stdout, stderr) {
                if (err)
                    console.log(err)
                else {
                    console.log(stdout);
                    console.log("<----- Uploading to Crowdin completed  ----->")
                }
            })
        }
    });
}

const downloadTranslations = function() {
    console.log("Downloading translations from Crowdin...")
    exec("crowdin download translations", function(err, stdout, stderr) {
        if (err)
            console.log(err)
        else {
            console.log(stdout);
            console.log("Compiling to JSON...")
            exec("./node_modules/.bin/compile-json locale i18n", function(err, stdout, stderr) {
                if (err)
                    console.log(err)
                else {
                    console.log(stdout);
                    console.log("<----- Downloading translations from Crowdin completed  ----->")
                }
            })
        }
    })
}

switch(process.argv[2]) {
  case 'upload':
    uploadSources();
    break;

  case 'download':
    downloadTranslations();
    break;

  default:
    console.log(`
      Crowdin Helper
      node crowdin-helper [command]
      COMMANDS
      upload              - Uploads source file to Crowdin
      download            - Downloads translations from Crowdin
    `);
}