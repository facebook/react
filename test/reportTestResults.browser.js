console._error = console.error;
console._warn = console.warn;
console._log = console.log;

console.log = window.print = function(message){
  console._log(message);
  testImageURL('/print?type=log&message=' + encodeURIComponent(message) + '&_=' + Date.now().toString(36));
};

console.error = function(message){
  console._error(message);
  testImageURL('/print?type=error&message=' + encodeURIComponent(message) + '&_=' + Date.now().toString(36));
};

console.warn = function(message){
  console._warn(message);
  testImageURL('/print?type=warn&message=' + encodeURIComponent(message) + '&_=' + Date.now().toString(36));
};

;(function(env){

  env.addReporter(new jasmine.JSReporter());
  env.addReporter(new TAPReporter(window.print));

  function report(){
    if (typeof jasmine.getJSReport != 'function') return setTimeout(report, 100);
    postDataToURL(JSON.stringify(jasmine.getJSReport()), '/reportTestResults', function(error, event){
      if (error) return console.error(error);
      console.log(event);
    });
  }

  var oldCallback = env.currentRunner().finishCallback;
  env.currentRunner().finishCallback = function(){
    if (oldCallback) oldCallback.apply(this, arguments);
    report();
  };

  function postDataToURL(data, url, callback){
    var id = '$' + (+new Date()).toString(36);
    
    var postReportingTarget = document.createElement('iframe');
    postReportingTarget.id = postReportingTarget.name = 'postReportingTarget' + id;

    var postReportingForm = document.createElement('form');
    postReportingForm.method = 'POST';
    postReportingForm.action = url;
    postReportingForm.target = postReportingTarget.name;
  
    var postReportingData = document.createElement('input');
    postReportingData.type = 'hidden';
    postReportingData.name = 'data';
    postReportingData.value = data || '{"error":"unknown error in postReportingData"}';
  
    postReportingForm.appendChild(postReportingData);
    postReportingForm.appendChild(postReportingTarget);
    postReportingForm.style.cssText = "visibility:hidden; position:absolute; bottom:100%; right:100%";
    
    function done(error, event){
      postReportingForm.parentNode.removeChild(postReportingForm);
      callback(error, event);
    }
    
    postReportingTarget.onerror = function(error){
      done(error);
    }
    postReportingTarget.onload = function(event){
      done(null, event);
    }
    document.body.appendChild(postReportingForm);
    setTimeout(function(){
      postReportingForm.submit();
    },0);
  }

}(window.jasmine.getEnv()));

