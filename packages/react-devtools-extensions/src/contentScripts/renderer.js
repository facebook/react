/**
 * In order to support reload-and-profile functionality, the renderer needs to be injected before any other scripts.
 * Since it is a complex file (with imports) we can't just toString() it like we do with the hook itself,
 * So this entry point (one of the web_accessible_resources) provides a way to eagerly inject it.
 * The hook will look for the presence of a global __REACT_DEVTOOLS_ATTACH__ and attach an injected renderer early.
 * The normal case (not a reload-and-profile) will not make use of this entry point though.
 *
 * @flow
 */

import {attach} from 'react-devtools-shared/src/backend/fiber/renderer';
import {SESSION_STORAGE_RELOAD_AND_PROFILE_KEY} from 'react-devtools-shared/src/constants';
import {sessionStorageGetItem} from 'react-devtools-shared/src/storage';

if (
  sessionStorageGetItem(SESSION_STORAGE_RELOAD_AND_PROFILE_KEY) === 'true' &&
  !window.hasOwnProperty('__REACT_DEVTOOLS_ATTACH__')
) {
  Object.defineProperty(
    window,
    '__REACT_DEVTOOLS_ATTACH__',
    ({
      enumerable: false,
      // This property needs to be configurable to allow third-party integrations
      // to attach their own renderer. Note that using third-party integrations
      // is not officially supported. Use at your own risk.
      configurable: true,
      get() {
        return attach;
      },
    }: Object),
  );
}
