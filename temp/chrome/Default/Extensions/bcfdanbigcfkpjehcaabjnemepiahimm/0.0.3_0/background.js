chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    chrome.runtime.sendNativeMessage(
      'com.meta.bento',
      request,
      function (response) {
	      if (chrome.runtime.lastError) {
           sendResponse({'status': 'error', 'error': chrome.runtime.lastError.message});
        } else {
           sendResponse(response);
        }
      }
    );
  }
);

