function createXMLHttpRequest(){
  try{return new XMLHttpRequest();}
  catch(e){}
  try {return new ActiveXObject("Msxml2.XMLHTTP");}
  catch (e) {}
  try {return new ActiveXObject("Microsoft.XMLHTTP");}
  catch (e) {}
}

function getURLSync(url){
  var request = createXMLHttpRequest();
  request.open('GET', url, /*asynchronous?*/false);
  return request.responseText;
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
