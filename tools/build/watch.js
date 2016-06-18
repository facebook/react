var chokidar = require('chokidar');
var runSequence = require('run-sequence');
var path = require('path');

function watch(globs, opts, tasks) {
  if (typeof opts !== 'object' || Array.isArray(opts)) {
    tasks = opts;
    opts = {};
  }

  var triggerCount = 0;
  var useRunSequence = typeof tasks !== 'function';
  var runTasks;

  if (useRunSequence) {
    if (!Array.isArray(tasks)) tasks = [tasks];
    tasks = tasks.slice();
    tasks.push(tasksDone);
    runTasks = function runTaskSequence() {
      runSequence.apply(null, tasks);
    }
  } else {
    var sync = tasks.length === 0;
    runTasks = function runCallback() {
      try {
        tasks(tasksDone);
        if (sync) tasksDone();
      } catch (e) {
        return tasksDone(e);
      }
    }
  }

  var events = opts.events = opts.events || ['add', 'change', 'unlink'];

  // Don't let chokidar call us while initializing because on large trees it might take too long for
  // all the add events to be emitted which causes the initial callback to be triggered more than
  // once. Instead, we call handleEvent directly.
  var ignoreInitial = opts.ignoreInitial;
  opts.ignoreInitial = true;

  var delay = opts.delay;
  if (delay === undefined) delay = 100;

  var watcher = chokidar.watch(globs, opts).
      on('all', handleEvent).
      on('error', function(err) {
        throw err;
      });

  var log = function watchLogger(triggerCount) {
    // Don't report change for initial event
    if (!ignoreInitial && !--triggerCount) return;

    process.stdout.write([
      '',
      '==================================================',
      ' WATCH TRIGGERED BY FILE CHANGE #' + triggerCount,
      ' On: ' + prettyTime(),
      '==================================================\n',
    ].join('\n'));

    function prettyTime() {
      var now = new Date();
      return now.toLocaleDateString() + " at " + now.toLocaleTimeString();
    }
  }

  if (opts.log !== undefined && !opts.log) {
    log = function noopLog(triggerCount) {}
  }

  var close = watcher.close.bind(watcher);
  watcher.close = function() {
    if (timeoutId !== null) clearTimeout(timeoutId);
    close();
  };

  var eventsRecorded = 0; // Number of events recorded
  var timeoutId = null; // If non-null, event capture window is open

  if (!ignoreInitial) {
    // synthetic event to kick off the first task run
    timeoutId = setTimeout(invokeCallback, delay);
  }

  return watcher;

  function handleEvent(event, filepath) {
    // Ignore unwatched events
    if (events.indexOf(event) < 0) return;

    // Increment number of events captured in this window
    ++eventsRecorded;

    if (timeoutId === null) {
      timeoutId = setTimeout(invokeCallback, delay);
    }
  }

  function invokeCallback() {
    eventsRecorded = 0;
    log(++triggerCount);
    runTasks();
  }

  function tasksDone(err) {
    if (eventsRecorded) {
      // eventsRecorded has increased during the run, run again on the next turn
      timeoutId = setTimeout(invokeCallback, 0);
    } else {
      timeoutId = null;
    }
    if (!useRunSequence && err) {
      console.log('Watch task error:', err.toString());
    }
  }
}

module.exports = watch;
