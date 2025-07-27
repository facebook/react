/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

import useOpenResource from '../useOpenResource';

import styles from './StackTraceView.css';

import type {ReactStackTrace, ReactCallSite} from 'shared/ReactTypes';

import formatLocationForDisplay from './formatLocationForDisplay';

type CallSiteViewProps = {
  callSite: ReactCallSite,
};

export function CallSiteView({callSite}: CallSiteViewProps): React.Node {
  const symbolicatedCallSite: null | ReactCallSite = null; // TODO
  const [linkIsEnabled, viewSource] = useOpenResource(
    callSite,
    symbolicatedCallSite,
  );
  const [functionName, url, line, column] =
    symbolicatedCallSite !== null ? symbolicatedCallSite : callSite;
  return (
    <div className={styles.CallSite}>
      {functionName}
      {' @ '}
      <span
        className={linkIsEnabled ? styles.Link : null}
        onClick={viewSource}
        title={url + ':' + line}>
        {formatLocationForDisplay(url, line, column)}
      </span>
    </div>
  );
}

type Props = {
  stack: ReactStackTrace,
};

export default function StackTraceView({stack}: Props): React.Node {
  return (
    <div className={styles.StackTraceView}>
      {stack.map((callSite, index) => (
        <CallSiteView key={index} callSite={callSite} />
      ))}
    </div>
  );
}
