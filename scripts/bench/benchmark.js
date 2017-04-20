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
  const results = await Lighthouse('http://localhost:8080/', {
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
    })
  });

  return averages;
}

function openChrome() {
  const platform = os.platform() ;

  if (platform === 'darwin') {
    spawn('/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary', [
      '--remote-debugging-port=9222',
    ]);
  } else if (platform === 'linux') {
    const child = spawn('xvfb-run', [
      `--server-args='-screen 0, 1024x768x16'`,
      'chromium-browser',
      '--user-data-dir=$TMP_PROFILE_DIR',
      '--start-maximized',
      '--no-first-run',
      '--no-sandbox',
      '--disable-gpu',
      '--remote-debugging-port=9222',
      '"about:blank"',
    ], { detached: true, stdio: ['ignore'] });
    child.unref();
  } else {
    // TODO
  }
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

  openChrome();
  // wait for chrome to load then continue
  await wait(3000);
  for (let i = 0; i < timesToRun; i++) {
    let launcher;
    try {
      launcher = new ChromeLauncher({port: 9222, autoSelectChrome: true});
    } catch (e) {}

    try {
      await launcher.isDebuggerReady();
    } catch (e) {
      launcher.run();
    }
    results.runs.push(await runScenario(benchmark, launcher));
    // add a delay or sometimes it confuses lighthouse and it hangs
    await wait(500);
    await launcher.kill()
  }
  if (startServer) {
    server.close();
  }  
  results.averages = calculateAverages(results.runs);
  return results;
}

module.exports = runBenchmark;

