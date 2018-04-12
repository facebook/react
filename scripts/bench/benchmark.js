'use strict';

const Lighthouse = require('lighthouse');
const ChromeLauncher = require('lighthouse/lighthouse-cli/chrome-launcher.js')
  .ChromeLauncher;
const stats = require('stats-analysis');
const config = require('lighthouse/lighthouse-core/config/perf.json');
const spawn = require('child_process').spawn;
const os = require('os');

const timesToRun = 10;

function wait(val) {
  return new Promise(resolve => setTimeout(resolve, val));
}

async function runScenario(benchmark, launcher) {
  const results = await Lighthouse(
    `http://localhost:8080/${benchmark}/`,
    {
      output: 'json',
      disableCpuThrottling: false,
      disableNetworkThrottling: false,
    },
    config
  );
  const perfMarkings = results.audits['user-timings'].extendedInfo.value;
  const entries = perfMarkings
    .filter(marker => !marker.isMark)
    .map(({duration, name}) => ({
      entry: name,
      time: duration,
    }));
  entries.push({
    entry: 'First Meaningful Paint',
    time: results.audits['first-meaningful-paint'].rawValue,
  });
  return entries;
}

function bootstrap(data) {
  const len = data.length;
  const arr = Array(len);
  for (let j = 0; j < len; j++) {
    arr[j] = data[(Math.random() * len) | 0];
  }
  return arr;
}

function calculateStandardErrorOfMean(data) {
  const means = [];
  for (let i = 0; i < 10000; i++) {
    means.push(stats.mean(bootstrap(data)));
  }
  return stats.stdev(means);
}

function calculateAverages(runs) {
  const data = [];
  const averages = [];

  runs.forEach((entries, x) => {
    entries.forEach(({entry, time}, i) => {
      if (i >= averages.length) {
        data.push([time]);
        averages.push({
          entry,
          mean: 0,
          sem: 0,
        });
      } else {
        data[i].push(time);
        if (x === runs.length - 1) {
          const dataWithoutOutliers = stats.filterMADoutliers(data[i]);
          averages[i].mean = stats.mean(dataWithoutOutliers);
          averages[i].sem = calculateStandardErrorOfMean(data[i]);
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
    const child = spawn('xvfb start', [{detached: true, stdio: ['ignore']}]);
    child.unref();
    // wait for chrome to load then continue
    await wait(3000);
    return child;
  }
}

async function launchChrome(headless) {
  let launcher;
  try {
    launcher = new ChromeLauncher({
      additionalFlags: [headless ? '--headless' : ''],
    });
    await launcher.isDebuggerReady();
  } catch (e) {
    return launcher.run();
  }
  return launcher;
}

async function runBenchmark(benchmark, headless) {
  const results = {
    runs: [],
    averages: [],
  };

  await initChrome();

  for (let i = 0; i < timesToRun; i++) {
    let launcher = await launchChrome(headless);

    results.runs.push(await runScenario(benchmark, launcher));
    // add a delay or sometimes it confuses lighthouse and it hangs
    await wait(500);
    try {
      await launcher.kill();
    } catch (e) {}
  }

  results.averages = calculateAverages(results.runs);
  return results;
}

module.exports = runBenchmark;
