/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {use, useContext} from 'react';

import useOpenResource from '../useOpenResource';

import styles from './StackTraceView.css';

import type {
  ReactStackTrace,
  ReactCallSite,
  ReactFunctionLocation,
} from 'shared/ReactTypes';

import FetchFileWithCachingContext from './FetchFileWithCachingContext';

import {symbolicateSourceWithCache} from 'react-devtools-shared/src/symbolicateSource';

import formatLocationForDisplay from './formatLocationForDisplay';

type CallSiteViewProps = {
  callSite: ReactCallSite,
};

export function CallSiteView({callSite}: CallSiteViewProps): React.Node {
  const fetchFileWithCaching = useContext(FetchFileWithCachingContext);

  const [virtualFunctionName, virtualURL, virtualLine, virtualColumn] =
    callSite;

  const symbolicatedCallSite: null | ReactFunctionLocation =
    fetchFileWithCaching !== null
      ? use(
          symbolicateSourceWithCache(
            fetchFileWithCaching,
            virtualURL,
            virtualLine,
            virtualColumn,
          ),
        )
      : null;

  const [linkIsEnabled, viewSource] = useOpenResource(
    callSite,
    symbolicatedCallSite,
  );
  const [functionName, url, line, column] =
    symbolicatedCallSite !== null ? symbolicatedCallSite : callSite;
  return (
    <div className={styles.CallSite}>
      {functionName || virtualFunctionName}
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
