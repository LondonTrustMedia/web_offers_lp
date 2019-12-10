#!/usr/bin/env node

//   sass [command]

//   COMMANDS
//   sass-all --- all-pages              - compile all the pages in sass folder

const path = require("path");
const fs = require("fs");
const scssPages = "../../assets/scss/pages/";
const cssPages = "../../assets/css/pages/";
const scssPages2 = "assets/scss/pages/";
const cssPages2 = "assets/css/pages/";

function getPages(callback) {
  var pages = [];
  const directoryPath = path.join(__dirname, scssPages);
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.log("Unable to scan directory: " + err);
      callback(err);
    } else {
      files.forEach(file => {
        pages.push(file.split(".")[0]);
      });
      pages = pages.filter(page => page !== "_index");
      callback(null, pages);
    }
  });
}
var exec = require("child_process").exec;
const compileAll = function() {
  getPages((err, pages) => {
    if (!err) {
      console.log("compiling pages...");
      var command = "sass --style compressed";
      pages.forEach(page => {
        console.log(`compiling ${page}....`);
        exec(
          `${command} ${scssPages2}${page}.scss:${cssPages2}${page}.css`,
          function(err, stdout, stderr) {
            if (err) console.log(err);
            else {
              console.log(stdout);
              console.log(`compiled ${page}....`);
            }
          }
        );
      });
    }
  });
};

const watchAll = function() {
  getPages((err, pages) => {
    if (!err) {
      console.log("compiling pages and watch...");
      var command = "sass --style compressed --watch";
      var fullCommand = command;
      pages.forEach(page => {
        fullCommand =
          fullCommand + " " + scssPages2 + page + ".scss:" + cssPages2 + page + ".css";
      });
      exec(fullCommand, function(err, stdout, stderr) {
        if (err) console.log(err);
        else {
          console.log(stdout);
        }
      });
    }
  });
};
switch (process.argv[2]) {
  case "all-pages":
    compileAll();
    break;

  case "watchAll":
    watchAll();
    break;

  default:
    console.log(`
        Sass compiler Helper
        COMMANDS
            sass-all              - compile all the pages to css
            sass-watch            - compile all the pages to css and watch
        `);
}
