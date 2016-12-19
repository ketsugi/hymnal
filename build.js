'use strict';

// Library imports
const osType = require("os").type;
const fs = require("fs-extra");
const execFileSync = require("child_process").execFileSync;
const pdfMerge = require("easy-pdf-merge");
const ebookConvert = require("ebook-convert");

// CONSTANTS
const CONFIG_FILE_PATH = "./config.json";
const DEFAULT_MUSESCORE_EXE_PATH_WINDOWS = "C:\\Program Files (x86)\\MuseScore 2\\bin\\MuseScore.exe";
const DEFAULT_MUSESCORE_EXE_PATH_MAC = ""; // To be verified and entered
const SOURCE_PATH = "./src/";
const BUILD_PATH = "build/";
const BUILD_FILE_PDF = "build/Hymnal.pdf";
const BUILD_FILE_EPUB = "build/Hymnal.epub";

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
try {
  fs.ensureFileSync(config.path);
}
catch (e) {
  log("File not found at " + config.path);
  return;
}

/* Convert MuseScore files to PDFs */

// Get the list of source files
const listOfMSCZFiles = fs.readdirSync(SOURCE_PATH);

// Wipe the build folder and re-create it
fs.remove(BUILD_PATH, function() {
  fs.mkdirs(BUILD_PATH);

  listOfMSCZFiles.forEach((fileName) => {
    const exportFileName = generateExportedPDFFileName(fileName);
    log("Converting " + fileName + "...");

    execFileSync(config.path, ["-o", exportFileName, SOURCE_PATH + fileName]);
  });

  // Get list of PDF files
  const listOfPDFFiles = fs.readdirSync(BUILD_PATH).map(fileName => BUILD_PATH + fileName);
  log("Generating hymnal PDF...");

  pdfMerge(listOfPDFFiles, BUILD_FILE_PDF, (error) => {
    if (error) {
      log(error);
    }

    // Convert to epub
    const epub = getEpubConverter(BUILD_FILE_PDF, BUILD_FILE_EPUB);
    epub.on("end", () => log("Converted to EPUB"));
  });
});

/* Helper Functions */

function generateExportedPDFFileName(fileName) {
  return BUILD_PATH + fileName.split(".mscz")[0] + ".pdf";
}

function getEpubConverter(source, destination) {
  return ebookConvert({
    source: source,
    target: destination,
    arguments: [
      ['--authors', 'Joel Pan']
    ]
  });
}