/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {Fragment, useContext, useMemo} from 'react';
import {StoreContext} from 'react-devtools-shared/src/devtools/views/context';
import {useSubscription} from 'react-devtools-shared/src/devtools/views/hooks';
import {NativeStyleContext} from './context';
import LayoutViewer from './LayoutViewer';
import StyleEditor from './StyleEditor';
import {TreeStateContext} from '../TreeContext';

type Props = {||};

export default function NativeStyleEditorWrapper(_: Props) {
  const store = useContext(StoreContext);

  const subscription = useMemo(
    () => ({
      getCurrentValue: () => store.supportsNativeStyleEditor,
      subscribe: (callback: Function) => {
        store.addListener('supportsNativeStyleEditor', callback);
        return () => {
          store.removeListener('supportsNativeStyleEditor', callback);
        };
      },
    }),
    [store],
  );
  const supportsNativeStyleEditor = useSubscription<boolean>(subscription);

  if (!supportsNativeStyleEditor) {
    return null;
  }

  return <NativeStyleEditor />;
}

function NativeStyleEditor(_: Props) {
  const {getStyleAndLayout} = useContext(NativeStyleContext);

  const {inspectedElementID} = useContext(TreeStateContext);
  if (inspectedElementID === null) {
    return null;
  }

  const maybeStyleAndLayout = getStyleAndLayout(inspectedElementID);
  if (maybeStyleAndLayout === null) {
    return null;
  }

  const {layout, style} = maybeStyleAndLayout;

  return (
    <Fragment>
      {layout !== null && (
        <LayoutViewer id={inspectedElementID} layout={layout} />
      )}
      {style !== null && (
        <StyleEditor
          id={inspectedElementID}
          style={style !== null ? style : {}}
        />
      )}
    </Fragment>
  );
}
