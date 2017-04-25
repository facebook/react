'use strict';

const Lighthouse = require('lighthouse');
const ChromeLauncher = require('lighthouse/lighthouse-cli/chrome-launcher.js').ChromeLauncher;
const serveBenchmark = require('./server');
const stats = require('stats-analysis');
const config = require('lighthouse/lighthouse-core/config/perf.json');
const spawn = require('child_process').spawn;
const os = require('os');

const timesToRun = 10;

function wait(val) {
  return new Promise(resolve => setTimeout(resolve, val));
}

async function runScenario(benchmark, launcher) {
  const results = await Lighthouse(`http://localhost:8080/?${benchmark}`, {
    output: 'json',
  }, config);
  const perfMarkings = results.audits['user-timings'].extendedInfo.value;
  const entries = perfMarkings
        .filter(marker => !marker.isMark)
        .map(({ duration, name }) => ({
          entry: name,
          time: duration,
        }));
  return entries;
}

function calculateAverages(runs) {
  const data = [];
  const averages = [];

  runs.forEach((entries, x) => {
    entries.forEach(({ entry, time }, i) => {
      if (i >= averages.length) {
        data.push([time]);
        averages.push({
          entry,
          mean: 0,
        });
      } else {
        data[i].push(time);
        if (x === runs.length - 1) {
          averages[i].mean = stats.mean(
            stats.filterMADoutliers(data[i])
          ).toFixed(2) * 1;
        }
      }
    });
  });

  return averages;
}

async function initChrome() {
  const platform = os.platform();

  if (platform === 'linux') {
    process.env.XVFBARGS = '-screen 0, 1024x768x16';
    process.env.LIGHTHOUSE_CHROMIUM_PATH = 'chromium-browser';
    const child = spawn('xvfb start', [{ detached: true, stdio: ['ignore'] }]);
    child.unref();
    // wait for chrome to load then continue
    await wait(3000);
    return child;
  }
}

async function launchChrome() {
  let launcher;
  try {
    launcher = new ChromeLauncher();
    await launcher.isDebuggerReady();
  } catch (e) {
    console.log('Launching Chrome');
    return launcher.run();
  }
  return launcher;
}

async function runBenchmark(benchmark, startServer) {
  let server;

  if (startServer) {
    server = serveBenchmark(benchmark);
    await wait(1000);
  }

  const results = {
    runs: [],
    averages: [],
  };

  await initChrome();

  for (let i = 0; i < timesToRun; i++) {
    let launcher = await launchChrome();
    results.runs.push(await runScenario(benchmark, launcher));

    // add a delay or sometimes it confuses lighthouse and it hangs
    await wait(500);
    await launcher.kill();
  }
  if (startServer) {
    server.close();
  }
  results.averages = calculateAverages(results.runs);
  return results;
}

module.exports = runBenchmark;

