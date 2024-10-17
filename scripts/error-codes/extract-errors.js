'use strict';

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

// Utility function to execute shell commands asynchronously
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        if (error.code === 1 && stdout === '') {
          // No unminified errors found
          return resolve('');
        }
        return reject(error);
      }
      resolve(stdout);
    });
  });
};

// Function to load and parse JSON
async function loadJSON(filePath) {
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
}

// Function to save JSON data back to the file
async function saveJSON(filePath, jsonData) {
  await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
}

// Main function
async function main() {
  try {
    const filePath = path.resolve(__dirname, '../error-codes/codes.json');
    const originalJSON = await loadJSON(filePath);
    
    const existingMessages = new Set();
    const codes = Object.keys(originalJSON);
    let nextCode = 0;
    
    // Track used messages and determine the next available error code
    codes.forEach(codeStr => {
      const message = originalJSON[codeStr];
      const code = parseInt(codeStr, 10);
      existingMessages.add(message);
      if (code >= nextCode) {
        nextCode = code + 1;
      }
    });

    console.log('Searching `build` directory for unminified errors...\n');
    
    // Search for unminified errors asynchronously
    const grepCommand = `git --no-pager grep -n --untracked --no-exclude-standard '/*! <expected-error-format>' -- build`;
    const grepOutput = await execCommand(grepCommand);
    if (!grepOutput) {
      console.log('No unminified errors found.');
      return;
    }

    // Process matched error messages and add them to the JSON
    const regex = /<expected-error-format>"(.+?)"<\/expected-error-format>/g;
    let match;
    while ((match = regex.exec(grepOutput)) !== null) {
      const message = match[1].trim();
      if (!existingMessages.has(message)) {
        // Log the new message and assign a new error code
        console.log(`"${nextCode}": "${message}"`);
        originalJSON[nextCode] = message;
        existingMessages.add(message);
        nextCode += 1;
      }
    }

    // Save the updated JSON if new messages were added
    await saveJSON(filePath, originalJSON);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
