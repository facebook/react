/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactProfilerData} from './types';

import * as React from 'react';
import {useState} from 'react';

import ImportPage from './ImportPage';
import CanvasPage from './CanvasPage';

export default function App() {
  const [profilerData, setProfilerData] = useState<ReactProfilerData | null>(
    null,
  );

  if (profilerData) {
    return <CanvasPage profilerData={profilerData} />;
  } else {
    return <ImportPage onDataImported={setProfilerData} />;
  }
}
