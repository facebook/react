testImageURL._recycle = function(img){
  console.log('_recycle', img);
  try {
    img.src = '';
    img.onload = img.onerror = null;
  } catch(e){}
  testImageURL._recycleBin.push(img);
}
testImageURL.getImage = function(callback){
  // if (!testImageURL._recycleBin) testImageURL._recycleBin = [new Image(),new Image(),new Image(),new Image()];
  // function get(){
  //   if (testImageURL._recycleBin.length === 0) return setTimeout(get, 100);
  //   callback(testImageURL._recycleBin.shift(), testImageURL._recycle);
  // }
  // get();
  callback(new Image(), function recycle(){});
}

testImageURL.defaultCallback = function(error, event){}

function testImageURL(url, timeout, callback){
  if (typeof timeout == 'function'){
    callback = timeout;
    timeout = testImageURL.timeout;
  }
  if (typeof callback != 'function') callback = testImageURL.defaultCallback;
  
  testImageURL.getImage(function(img, done){
    function callbackWrapper(error, event){
      callbackWrapper = testImageURL.noop;
      clearTimeout(timer);
      done(img);
      img = url = timeout = null;
      callback(error, event);
      error = event = callback = null;
    }
  
    var timer = setTimeout(function(){callbackWrapper(Error('timeout'));}, timeout);
  
    try {
      img.onload = function(event){ callbackWrapper(null, event || window.event); };
      img.onerror = function(error){ callbackWrapper(error); };
      img.src = url;
      
      if (img.complete === true
        || img.readyState == 4
        || img.width > 0
        || img.height > 0
        || img.readyState == 'complete'
      ) callbackWrapper(null, null);
    }
    catch(error){
      callbackWrapper(error);
    }
  });
}

testImageURL.noop = function(){};

testImageURL.timeout = 5000;
