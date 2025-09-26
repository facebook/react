// Test script to verify enhanced error handling and logging

const { updateVersionsForNext } = require('./scripts/release/utils');
const { getMergeBaseFromLocalGitRepo, executeCommand } = require('./scripts/bench/build');

async function testEnhancements() {
  console.log('Testing enhanced error handling...\n');

  // Test updateVersionsForNext with invalid cwd
  console.log('1. Testing updateVersionsForNext with invalid cwd:');
  try {
    await updateVersionsForNext('', '18.0.0', '0.0.0-test');
  } catch (error) {
    console.log('Error caught:', error.message);
  }

  console.log('\n2. Testing getMergeBaseFromLocalGitRepo with non-existent path:');
  try {
    await getMergeBaseFromLocalGitRepo('/non/existent/path');
  } catch (error) {
    console.log('Error caught:', error.message);
  }

  console.log('\n3. Testing executeCommand with invalid command:');
  try {
    await executeCommand('invalid-command-that-does-not-exist');
  } catch (error) {
    console.log('Error caught:', error.message);
  }

  console.log('\nTesting complete.');
}

testEnhancements().catch(console.error);
