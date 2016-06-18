declare var exportFunction;
declare var unsafeWindow;

exportFunction(function() {
  var curTime = unsafeWindow.performance.now();
  (<any>self).port.emit('startProfiler', curTime);
}, unsafeWindow, {defineAs: "startProfiler"});

exportFunction(function() { (<any>self).port.emit('stopProfiler'); }, unsafeWindow,
               {defineAs: "stopProfiler"});

exportFunction(function(cb) {
  (<any>self).port.once('perfProfile', cb);
  (<any>self).port.emit('getProfile');
}, unsafeWindow, {defineAs: "getProfile"});

exportFunction(function() { (<any>self).port.emit('forceGC'); }, unsafeWindow,
               {defineAs: "forceGC"});

exportFunction(function(name) {
  var curTime = unsafeWindow.performance.now();
  (<any>self).port.emit('markStart', name, curTime);
}, unsafeWindow, {defineAs: "markStart"});

exportFunction(function(name) {
  var curTime = unsafeWindow.performance.now();
  (<any>self).port.emit('markEnd', name, curTime);
}, unsafeWindow, {defineAs: "markEnd"});
