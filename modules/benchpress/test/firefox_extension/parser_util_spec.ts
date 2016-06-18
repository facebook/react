import {convertPerfProfileToEvents} from 'benchpress/src/firefox_extension/lib/parser_util';

function assertEventsEqual(actualEvents, expectedEvents) {
  expect(actualEvents.length == expectedEvents.length);
  for (var i = 0; i < actualEvents.length; ++i) {
    var actualEvent = actualEvents[i];
    var expectedEvent = expectedEvents[i];
    for (var key in actualEvent) {
      expect(actualEvent[key]).toEqual(expectedEvent[key]);
    }
  }
};

export function main() {
  describe('convertPerfProfileToEvents', function() {
    it('should convert single instantaneous event', function() {
      var profileData = {
        threads: [
          {samples: [{time: 1, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]}]}
        ]
      };
      var perfEvents = convertPerfProfileToEvents(profileData);
      assertEventsEqual(perfEvents, [{ph: 'X', ts: 1, name: 'script'}]);
    });

    it('should convert single non-instantaneous event', function() {
      var profileData = {
        threads: [
          {
            samples: [
              {time: 1, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]},
              {time: 2, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]},
              {time: 100, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]}
            ]
          }
        ]
      };
      var perfEvents = convertPerfProfileToEvents(profileData);
      assertEventsEqual(perfEvents,
                        [{ph: 'B', ts: 1, name: 'script'}, {ph: 'E', ts: 100, name: 'script'}]);
    });

    it('should convert multiple instantaneous events', function() {
      var profileData = {
        threads: [
          {
            samples: [
              {time: 1, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]},
              {time: 2, frames: [{location: 'PresShell::Paint'}]}
            ]
          }
        ]
      };
      var perfEvents = convertPerfProfileToEvents(profileData);
      assertEventsEqual(perfEvents,
                        [{ph: 'X', ts: 1, name: 'script'}, {ph: 'X', ts: 2, name: 'render'}]);
    });

    it('should convert multiple mixed events', function() {
      var profileData = {
        threads: [
          {
            samples: [
              {time: 1, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]},
              {time: 2, frames: [{location: 'PresShell::Paint'}]},
              {time: 5, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]},
              {time: 10, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]}
            ]
          }
        ]
      };
      var perfEvents = convertPerfProfileToEvents(profileData);
      assertEventsEqual(perfEvents, [
        {ph: 'X', ts: 1, name: 'script'},
        {ph: 'X', ts: 2, name: 'render'},
        {ph: 'B', ts: 5, name: 'script'},
        {ph: 'E', ts: 10, name: 'script'}
      ]);
    });

    it('should add args to gc events', function() {
      var profileData = {threads: [{samples: [{time: 1, frames: [{location: 'forceGC'}]}]}]};
      var perfEvents = convertPerfProfileToEvents(profileData);
      assertEventsEqual(perfEvents, [{ph: 'X', ts: 1, name: 'gc', args: {usedHeapSize: 0}}]);
    });

    it('should skip unknown events', function() {
      var profileData = {
        threads: [
          {
            samples: [
              {time: 1, frames: [{location: 'FirefoxDriver.prototype.executeScript'}]},
              {time: 2, frames: [{location: 'foo'}]}
            ]
          }
        ]
      };
      var perfEvents = convertPerfProfileToEvents(profileData);
      assertEventsEqual(perfEvents, [{ph: 'X', ts: 1, name: 'script'}]);
    });
  });
};
