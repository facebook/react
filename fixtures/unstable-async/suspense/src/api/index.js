import {
  coreContributorListJSON,
  userProfileJSON,
  userRepositoriesListJSON,
} from './data';

export function fetchCoreContributorListJSON() {
  return makeFakeAPICall('/react/contributors', coreContributorListJSON);
}

export function fetchUserProfileJSON(id) {
  return makeFakeAPICall(`/${id}/details`, userProfileJSON[id]);
}

export function fetchUserRepositoriesListJSON(id) {
  return makeFakeAPICall(`/${id}/repositories`, userRepositoriesListJSON[id]);
}

let fakeRequestTime = 1000;
let onProgress = () => true;

export function setFakeRequestTime(val) {
  fakeRequestTime = val;
}

export function setProgressHandler(handler) {
  onProgress = handler;
}

export function setPauseNewRequests(value) {
  shouldPauseNewRequests = value;
}

let shouldPauseNewRequests = false;
let notifiers = {};
let isPausedUrl = {};

export function setPaused(url, isPaused) {
  const wasPaused = isPausedUrl[url];
  isPausedUrl[url] = isPaused;
  if (isPaused !== wasPaused) {
    notifiers[url]();
  }
}

function makeFakeAPICall(url, result) {
  let i = 1;
  return new Promise(resolve => {
    isPausedUrl[url] = shouldPauseNewRequests;
    function notify() {
      if (!isPausedUrl[url]) {
        i++;
      }
      onProgress(url, i, isPausedUrl[url]);
      if (isPausedUrl[url]) {
        return;
      }
      if (i === 100) {
        resolve(result);
      } else {
        setTimeout(notify, fakeRequestTime / 100);
      }
    }
    notifiers[url] = notify;
    notify();
  });
}
