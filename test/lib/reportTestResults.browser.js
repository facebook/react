;(function(env){
  env.addReporter(new jasmine.JSReporter());

  function report(){
    console.log('report');
    if (typeof jasmine.getJSReport != 'function') {
      console.log("typeof jasmine.getJSReport != 'function'");
      return setTimeout(report, 100);
    }
    postDataToURL(jasmine.getJSReport(), '/reportTestResults', function(error, event){
      console.log(error, event);
      if (error) return console.error(error);
      console.log(event);
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
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  request.send('data=' + encodeURIComponent(JSON.stringify(data)));
}
postDataToURL.defaultCallback = function(error){
  // console.log('postDataToURL.defaultCallback', arguments)
}
