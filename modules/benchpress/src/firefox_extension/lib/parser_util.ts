/**
 * @param {Object} perfProfile The perf profile JSON object.
 * @return {Object[]} An array of recognized events that are captured
 *     within the perf profile.
 */
export function convertPerfProfileToEvents(perfProfile: any): any[] {
  var inProgressEvents = new Map();  // map from event name to start time
  var finishedEvents = [];           // Event[] finished events
  var addFinishedEvent = function(eventName, startTime, endTime) {
    var categorizedEventName = categorizeEvent(eventName);
    var args = undefined;
    if (categorizedEventName == 'gc') {
      // TODO: We cannot measure heap size at the moment
      args = {usedHeapSize: 0};
    }
    if (startTime == endTime) {
      // Finished instantly
      finishedEvents.push({ph: 'X', ts: startTime, name: categorizedEventName, args: args});
    } else {
      // Has duration
      finishedEvents.push({ph: 'B', ts: startTime, name: categorizedEventName, args: args});
      finishedEvents.push({ph: 'E', ts: endTime, name: categorizedEventName, args: args});
    }
  };

  var samples = perfProfile.threads[0].samples;
  // In perf profile, firefox samples all the frames in set time intervals. Here
  // we go through all the samples and construct the start and end time for each
  // event.
  for (var i = 0; i < samples.length; ++i) {
    var sample = samples[i];
    var sampleTime = sample.time;

    // Add all the frames into a set so it's easier/faster to find the set
    // differences
    var sampleFrames = new Set();
    sample.frames.forEach(function(frame) { sampleFrames.add(frame.location); });

    // If an event is in the inProgressEvents map, but not in the current sample,
    // then it must have just finished. We add this event to the finishedEvents
    // array and remove it from the inProgressEvents map.
    var previousSampleTime = (i == 0 ? /* not used */ -1 : samples[i - 1].time);
    inProgressEvents.forEach(function(startTime, eventName) {
      if (!(sampleFrames.has(eventName))) {
        addFinishedEvent(eventName, startTime, previousSampleTime);
        inProgressEvents.delete(eventName);
      }
    });

    // If an event is in the current sample, but not in the inProgressEvents map,
    // then it must have just started. We add this event to the inProgressEvents
    // map.
    sampleFrames.forEach(function(eventName) {
      if (!(inProgressEvents.has(eventName))) {
        inProgressEvents.set(eventName, sampleTime);
      }
    });
  }

  // If anything is still in progress, we need to included it as a finished event
  // since recording ended.
  var lastSampleTime = samples[samples.length - 1].time;
  inProgressEvents.forEach(function(startTime, eventName) {
    addFinishedEvent(eventName, startTime, lastSampleTime);
  });

  // Remove all the unknown categories.
  return finishedEvents.filter(function(event) { return event.name != 'unknown'; });
}

// TODO: this is most likely not exhaustive.
export function categorizeEvent(eventName: string): string {
  if (eventName.indexOf('PresShell::Paint') > -1) {
    return 'render';
  } else if (eventName.indexOf('FirefoxDriver.prototype.executeScript') > -1) {
    return 'script';
  } else if (eventName.indexOf('forceGC') > -1) {
    return 'gc';
  } else {
    return 'unknown';
  }
}
