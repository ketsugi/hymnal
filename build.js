'use strict';

// Library imports
const osType = require("os").type;
const fs = require("fs");
const execFile = require('child_process').execFile;

// CONSTANTS
const CONFIG_FILE_PATH = "./config.json";
const DEFAULT_MUSESCORE_EXE_PATH_WINDOWS = "C:\\Program Files (x86)\\MuseScore 2\\bin\\MuseScore.exe";
const DEFAULT_MUSESCORE_EXE_PATH_MAC = ""; // To be verified and entered
const SOURCE_PATH = "./src/";
const BUILD_PATH = "build/";

// Set an alias for console.log
const log = console.log;

// Import the configuration files
log("Loading configuration...");
let config = {};
try {
  config = require(CONFIG_FILE_PATH);
}
catch (e) {
  log("Configuration file not found. Loading defaults.")
  config = {};
}

if (!config.path) {
  log("Detecting OS as " + osType());
  switch(osType()) {
    case "Windows_NT":
      config.path = DEFAULT_MUSESCORE_EXE_PATH_WINDOWS;
      break;
    case "Darwin":
      config.path = DEFAULT_MUSESCORE_EXE_PATH_MAC;
      break;
  }
}

log("Setting MuseScore executable path to: " + config.path);

// Check to see if executable exists at path
if (!fs.existsSync(config.path)) {
  log("File not found at " + config.path);
  return;
}

/* Convert MuseScore files to PDFs */

// Get the list of source files
const listOfMSCZFiles = fs.readdirSync(SOURCE_PATH);

listOfMSCZFiles.forEach((fileName) => {
  const exportFileName = generateExportedPDFFileName(fileName);
  execFile(config.path, ["-o", exportFileName, SOURCE_PATH + fileName], (error, stdout, stderr) => {
    if (error) {
      throw error;
    }

    log(stdout);
  });
});

/* Helper Functions */

function generateExportedPDFFileName(fileName) {
  return BUILD_PATH + fileName.split(".mscz")[0] + ".pdf";
}