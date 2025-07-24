/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactFunctionLocation} from 'shared/ReactTypes';

import {useCallback, useContext, useSyncExternalStore} from 'react';

import ViewElementSourceContext from './Components/ViewElementSourceContext';

import {getOpenInEditorURL} from '../../utils';
import {LOCAL_STORAGE_OPEN_IN_EDITOR_URL} from '../../constants';

const useOpenResource = (
  source: null | ReactFunctionLocation,
  symbolicatedSource: null | ReactFunctionLocation,
): [
  boolean, // isEnabled
  () => void, // Open Resource
] => {
  const {canViewElementSourceFunction, viewElementSourceFunction} = useContext(
    ViewElementSourceContext,
  );

  // TODO: const editorURL =
  useSyncExternalStore(
    function subscribe(callback) {
      window.addEventListener(LOCAL_STORAGE_OPEN_IN_EDITOR_URL, callback);
      return function unsubscribe() {
        window.removeEventListener(LOCAL_STORAGE_OPEN_IN_EDITOR_URL, callback);
      };
    },
    function getState() {
      return getOpenInEditorURL();
    },
  );

  // In some cases (e.g. FB internal usage) the standalone shell might not be able to view the source.
  // To detect this case, we defer to an injected helper function (if present).
  const linkIsEnabled =
    viewElementSourceFunction != null &&
    source != null &&
    (canViewElementSourceFunction == null ||
      canViewElementSourceFunction(source, symbolicatedSource));

  const viewSource = useCallback(() => {
    if (viewElementSourceFunction != null && source != null) {
      viewElementSourceFunction(source, symbolicatedSource);
    }
  }, [source, symbolicatedSource]);

  return [linkIsEnabled, viewSource];
};

export default useOpenResource;
