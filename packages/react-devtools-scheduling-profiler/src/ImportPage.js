/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {TimelineEvent} from '@elg/speedscope';
import type {ReactProfilerData} from './types';

import * as React from 'react';
import {useCallback, useRef} from 'react';

import profilerBrowser from './assets/profilerBrowser.png';
import style from './ImportPage.css';

import preprocessData from './utils/preprocessData';
import {readInputData} from './utils/readInputData';

type Props = {|
  onDataImported: (profilerData: ReactProfilerData) => void,
|};

export default function ImportPage({onDataImported}: Props) {
  const processTimeline = useCallback(
    (events: TimelineEvent[]) => {
      if (events.length > 0) {
        onDataImported(preprocessData(events));
      }
    },
    [onDataImported],
  );

  const handleProfilerInput = useCallback(
    async (event: SyntheticInputEvent<HTMLInputElement>) => {
      const readFile = await readInputData(event.target.files[0]);
      processTimeline(JSON.parse(readFile));
    },
    [processTimeline],
  );

  const upload = useRef(null);

  return (
    <div className={style.App}>
      <div className={style.container}>
        <div className={style.card}>
          <div className={style.cardcontainer}>
            <div className={style.row}>
              <div className={style.column}>
                <img
                  src={profilerBrowser}
                  className={style.browserScreenshot}
                  alt="logo"
                />
              </div>
              <div className={style.columncontent}>
                <h2>React Concurrent Mode Profiler</h2>
                <hr />
                <p>
                  Import a captured{' '}
                  <a
                    className={style.link}
                    href="https://developers.google.com/web/tools/chrome-devtools/evaluate-performance">
                    performance profile
                  </a>{' '}
                  from Chrome Devtools.
                  <br />
                  To zoom, scroll while holding down <kbd>Ctrl</kbd> or{' '}
                  <kbd>Shift</kbd>
                </p>
                <p className={style.legendKey}>
                  <svg height="20" width="20">
                    <circle cx="10" cy="10" r="5" fill="#ff718e" />
                  </svg>
                  State Update Scheduled
                  <br />
                  <svg height="20" width="20">
                    <circle cx="10" cy="10" r="5" fill="#9fc3f3" />
                  </svg>
                  State Update Scheduled
                  <br />
                  <svg height="20" width="20">
                    <circle cx="10" cy="10" r="5" fill="#a6e59f" />
                  </svg>
                  Suspended
                </p>

                <div className={style.buttongrp}>
                  <label htmlFor="upload">
                    <button
                      className={style.ImportButton}
                      onClick={() => upload.current && upload.current.click()}>
                      Import
                    </button>
                    <input
                      type="file"
                      ref={upload}
                      className={style.inputbtn}
                      onChange={handleProfilerInput}
                      accept="application/json"
                    />
                  </label>
                  <a href="https://github.com/MLH-Fellowship/scheduling-profiler-prototype">
                    <button className={style.ViewSourceButton}>
                      <span>Source </span>
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
