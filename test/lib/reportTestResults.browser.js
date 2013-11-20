var __DEBUG__ = location.search.substring(1).indexOf('debug') != -1;

if (typeof console == 'undefined') console = {
  log: function(){},
  warn: function(){},
  error: function(){}
};

var __consoleReport__ = [];

console._log = console.log;
console.log = function(message){
  console._log(message);
  if (__DEBUG__) postDataToURL({type:'log', message:message}, '/reportTestResults');
  else __consoleReport__.push({type:'log', message:message});
}

console._error = console.error;
console.error = function(message){
  console._error(message);
  if (__DEBUG__) postDataToURL({type:'error', message:message}, '/reportTestResults');
  else __consoleReport__.push({type:'error', message:message});
}

console._flush = function(){
  postDataToURL(__consoleReport__, '/console');
  __consoleReport__.length = 0;
}

;(function(env){
  env.addReporter(new jasmine.JSReporter());
  env.addReporter(new TAPReporter(console.log.bind(console)));

  function report(){
    if (typeof jasmine.getJSReport != 'function') {
      return setTimeout(report, 100);
    }
    if (!__DEBUG__) {
      console.log('DONE\t' + navigator.userAgent);
      console._flush();
    }
  }

  var oldCallback = env.currentRunner().finishCallback;
  env.currentRunner().finishCallback = function(){
    if (oldCallback) oldCallback.apply(this, arguments);
    report();
  };

}(window.jasmine.getEnv()));

function createXMLHttpRequest(){
  try{return new XMLHttpRequest();}
  catch(e){}
  try {return new ActiveXObject("Msxml2.XMLHTTP");}
  catch (e) {}
  try {return new ActiveXObject("Microsoft.XMLHTTP");}
  catch (e) {}
}
function postDataToURL(data, url, callback) {
  if (!callback) callback = postDataToURL.defaultCallback;
  var request = createXMLHttpRequest();
  if (!request) return callback(Error('XMLHttpRequest is unsupported'));
  postDataToURL.running = (postDataToURL.running||0) + 1;
  request.onreadystatechange = function(){
    if (request.readyState != 4) return;
    request.onreadystatechange = null;
    postDataToURL.running = (postDataToURL.running||0) - 1;
    callback(request.status == 200 ? null : request.status, request.responseText);
  };
  request.open('POST', url);
  request.setRequestHeader('Content-Type', 'application/json');
  request.send(JSON.stringify(data));
}
postDataToURL.defaultCallback = function(error){
  // console.log('postDataToURL.defaultCallback', arguments)
}
