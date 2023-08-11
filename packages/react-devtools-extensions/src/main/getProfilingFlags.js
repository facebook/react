import {
  localStorageGetItem,
  localStorageRemoveItem,
} from 'react-devtools-shared/src/storage';
import {LOCAL_STORAGE_SUPPORTS_PROFILING_KEY} from 'react-devtools-shared/src/constants';

function getProfilingFlags() {
  // This flag lets us tip the Store off early that we expect to be profiling.
  // This avoids flashing a temporary "Profiling not supported" message in the Profiler tab,
  // after a user has clicked the "reload and profile" button.
  let isProfiling = false;
  let supportsProfiling = false;

  if (localStorageGetItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY) === 'true') {
    supportsProfiling = true;
    isProfiling = true;
    localStorageRemoveItem(LOCAL_STORAGE_SUPPORTS_PROFILING_KEY);
  }

  return {isProfiling, supportsProfiling};
}

export default getProfilingFlags;
