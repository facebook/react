var rewire = require('rewire');

describe('watch()', function() {
  var timeout;
  var watch;
  var watcher;
  var unmock;

  beforeEach(function() {
    timeout = mockTimeout();
    var watchModule = rewire('./watch');
    unmock = watchModule.__set__(timeout.mocks);
    watch = watchModule.__get__('watch');
  });

  afterEach(function() {
    // Shouldn't really be necessary, but...
    if (watcher) {
      watcher.close();
      watcher = null;
    }
    unmock();
    expect(timeout.pending).toBe(0);
    timeout = null;
  });


  it('should fire callback once for events which occur within `delay` window', function() {
    var cb = jasmine.createSpy('callback');
    watcher = watch('./$$fake_path/**/*', { delay: 10, log: false }, cb);

    watcher._emit('add', './$$fake_path/test.txt');
    timeout.flush(9);
    expect(cb).not.toHaveBeenCalled();

    watcher._emit('change', './$$fake_path/test.txt');
    watcher._emit('add', './$$fake_path/test2.txt');
    watcher._emit('change', './$$fake_path/test2.txt');
    watcher._emit('add', './$$fake_path/test3.txt');
    watcher._emit('change', './$$fake_path/test3.txt');
    expect(cb).not.toHaveBeenCalled();

    timeout.flush(1);
    expect(cb.calls.count()).toBe(1);
  });


  it('should trigger callback if events are collected during task running', function() {
    var calls = 0;
    function cb(done) {
      if (++calls !== 1) return done();

      watcher._emit('change', './$$fake_path/test1.txt');
      watcher._emit('change', './$$fake_path/test2.txt');

      // Before the done callback, there are no pending timer events
      expect(timeout.pending).toBe(0);
      done();

      // Afterwards, there is one
      expect(timeout.pending).toBe(1);
    }

    var watcher = watch('./$$fake_path/**/*', { delay: 10, log: false }, cb);

    watcher._emit('change', './$$fake_path/test1.txt');
    expect(timeout.pending).toBe(1);
    expect(calls).toBe(0);

    timeout.flush(10);
    expect(calls).toBe(2);
  });


  it('should continue to trigger callbacks if task throws', function() {
    var calls = 0;
    spyOn(console, 'log');
    function cb(done) {
      calls += 1;
      if (calls === 1) throw new Error('oops!');
      done();
    }

    var watcher = watch('./$$fake_path/**/*', { delay: 10, log: false }, cb);

    watcher._emit('change', './$$fake_path/test1.txt');
    timeout.flush();
    expect(calls).toBe(1);
    expect(console.log).toHaveBeenCalledWith('Watch task error:', 'Error: oops!');

    watcher._emit('change', './$$fake_path/test2.txt');
    timeout.flush();
    expect(calls).toBe(2);
  });


  it('should cancel pending callback if FSWatcher is closed', function() {
    var cb = jasmine.createSpy('callback');
    var watcher = watch('./$$fake_path/**/*', { delay: 10, log: false }, cb);

    watcher._emit('change', './$$fake_path/test1.txt');
    expect(timeout.pending).toBe(1);
    expect(cb).not.toHaveBeenCalled();

    watcher.close();
    expect(timeout.pending).toBe(0);
  });


  it('should cancel followup pending callback if FSWatcher is closed during task', function() {
    var calls = 0;
    function cb(done) {
      if (++calls !== 1) return done();

      watcher._emit('change', './$$fake_path/test2.txt');
      done();
      expect(timeout.pending).toBe(1);
      watcher.close();
      expect(timeout.pending).toBe(0);
    }

    var watcher = watch('./$$fake_path/**/*', { delay: 10, log: false }, cb);
    watcher._emit('change', './$$fake_path/test1.txt');

    timeout.flush(10);

    expect(calls).toBe(1);
  });
});


// setTimeout/clearTimeout mocking, mostly stolen from angular-mocks.js
function mockTimeout() {
  var events = [];
  var id = 0;
  var now = 0;

  return {
    mocks: {
      setTimeout: mockSetTimeout,
      clearTimeout: mockClearTimeout
    },
    flush: flush,
    get pending() { return events.length; }
  };

  function mockSetTimeout(fn, delay) {
    delay = delay || 0;
    events.push({
      time: now + delay,
      fn: fn,
      id: id
    });
    events.sort(function(a, b) { return a.time - b.time; });
    return id++;
  }

  function mockClearTimeout(id) {
    for (var i = 0; i < events.length; ++i) {
      if (events[i].id === id) {
        events.splice(i, 1);
        break;
      }
    }
  }

  function flush(delay) {
    if (delay !== undefined) now += delay;
    else if (events.length) now = events[events.length - 1].time;
    else throw new Error('No timer events registered');

    while (events.length && events[0].time <= now) {
      events.shift().fn();
    }
  }
}
