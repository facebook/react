const { exec } = require('child_process');
const readline = require('readline');

function promptForInput(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function runBuild() {
  let editorUrl = process.env.EDITOR_URL;

  if (!editorUrl) {
    editorUrl = await promptForInput("EDITOR_URL is not set. Please enter the EDITOR_URL: ");
  }

  // Set the EDITOR_URL environment variable
  process.env.EDITOR_URL = editorUrl;

  // Run the build command
  exec('cross-env NODE_ENV=development FEATURE_FLAG_TARGET=extension-fb node ./chrome/build', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

runBuild();
