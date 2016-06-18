var {Cc, Ci, Cu} = require('chrome');
var os = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
var ParserUtil = require('./parser_util');

class Profiler {
  private _profiler;
  private _markerEvents: any[];
  private _profilerStartTime: number;

  constructor() { this._profiler = Cc['@mozilla.org/tools/profiler;1'].getService(Ci.nsIProfiler); }

  start(entries, interval, features, timeStarted) {
    this._profiler.StartProfiler(entries, interval, features, features.length);
    this._profilerStartTime = timeStarted;
    this._markerEvents = [];
  }

  stop() { this._profiler.StopProfiler(); }

  getProfilePerfEvents() {
    var profileData = this._profiler.getProfileData();
    var perfEvents = ParserUtil.convertPerfProfileToEvents(profileData);
    perfEvents = this._mergeMarkerEvents(perfEvents);
    perfEvents.sort(function(event1, event2) { return event1.ts - event2.ts; });  // Sort by ts
    return perfEvents;
  }

  _mergeMarkerEvents(perfEvents: any[]): any[] {
    this._markerEvents.forEach(function(markerEvent) { perfEvents.push(markerEvent); });
    return perfEvents;
  }

  addStartEvent(name: string, timeStarted: number) {
    this._markerEvents.push({ph: 'b', ts: timeStarted - this._profilerStartTime, name: name});
  }

  addEndEvent(name: string, timeEnded: number) {
    this._markerEvents.push({ph: 'e', ts: timeEnded - this._profilerStartTime, name: name});
  }
}

function forceGC() {
  Cu.forceGC();
  os.notifyObservers(null, 'child-gc-request', null);
};

var mod = require('sdk/page-mod');
var data = require('sdk/self').data;
var profiler = new Profiler();
mod.PageMod({
  include: ['*'],
  contentScriptFile: data.url('installed_script.js'),
  onAttach: worker => {
    worker.port.on('startProfiler',
                   (timeStarted) => profiler.start(/* = profiler memory */ 3000000, 0.1,
                                                   ['leaf', 'js', 'stackwalk', 'gc'], timeStarted));
    worker.port.on('stopProfiler', () => profiler.stop());
    worker.port.on('getProfile',
                   () => worker.port.emit('perfProfile', profiler.getProfilePerfEvents()));
    worker.port.on('forceGC', forceGC);
    worker.port.on('markStart', (name, timeStarted) => profiler.addStartEvent(name, timeStarted));
    worker.port.on('markEnd', (name, timeEnded) => profiler.addEndEvent(name, timeEnded));
  }
});
