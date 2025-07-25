/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useCallback, useSyncExternalStore} from 'react';

import {getOpenInEditorURL} from '../../utils';
import {LOCAL_STORAGE_OPEN_IN_EDITOR_URL} from '../../constants';

const useEditorURL = (): string => {
  const editorURL = useSyncExternalStore(
    useCallback(function subscribe(callback) {
      window.addEventListener(LOCAL_STORAGE_OPEN_IN_EDITOR_URL, callback);
      return function unsubscribe() {
        window.removeEventListener(LOCAL_STORAGE_OPEN_IN_EDITOR_URL, callback);
      };
    }, []),
    getOpenInEditorURL,
  );
  return editorURL;
};

export default useEditorURL;
