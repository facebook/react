if (typeof console == 'undefined') console = {
  log: function(){},
  warn: function(){},
  error: function(){}
};

console._log = console.log;
console.log = function(message){
  console._log(message);
  postDataToURL({type:'log', message:message}, '/reportTestResults');
}
console._error = console.error;
console.error = function(message){
  console._error(message);
  postDataToURL({type:'error', message:message}, '/reportTestResults');
}

;(function(env){
  env.addReporter(new jasmine.JSReporter());
  if (location.search.substring(1).indexOf('debug') != -1){
    env.addReporter(new TAPReporter(console.log.bind(console)));
  }

  function report(){
    if (typeof jasmine.getJSReport != 'function') {
      console.log("typeof jasmine.getJSReport != 'function'");
      return setTimeout(report, 100);
    }
    postDataToURL(jasmine.getJSReport(), '/reportTestResults', function(error, results){
      if (error) return console.error(error);
    });
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
