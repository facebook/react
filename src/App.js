// @flow

import type {ReactProfilerData} from './types';

import React, {useState} from 'react';

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
