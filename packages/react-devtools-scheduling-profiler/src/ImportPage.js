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
import {useState, useCallback, useRef} from 'react';

import profilerBrowserImg from './assets/profilerBrowser.png';
import lanesImg from './assets/lanes.png';
import flamechartImg from './assets/flamechart.png';
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
      setShowSpinner(true);
      const readFile = await readInputData(event.target.files[0]);
      processTimeline(JSON.parse(readFile));
    },
    [processTimeline],
  );

  const upload = useRef(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const toggleModal = () => {
    setShowModal(!showModal);
  };

  return (
    <div className={style.App}>
      <div className={style.Card}>
        <div className={style.Row}>
          <div className={style.Column}>
            {showSpinner ? (
              <>
                <div className={style.Spinner}>Loading...</div>
                <p className={style.SpinnerText}>
                  (Loading profile, it may seem like the page is frozen)
                </p>
              </>
            ) : (
              <img
                src={profilerBrowserImg}
                className={style.Screenshot}
                alt="logo"
              />
            )}
          </div>
          <div className={style.Column}>
            <h2>
              <span className={style.Header}>
                React Concurrent Mode Profiler
              </span>
              <a
                className={style.GithubIcon}
                target="_blank"
                href="https://github.com/facebook/react/tree/master/packages/react-devtools-scheduling-profiler">
                <svg width="24" height="24" viewBox="0 0 16 16">
                  <path
                    fillRule="evenodd"
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
                  />
                </svg>
              </a>
            </h2>
            <p>
              Analyze and improve React application performance in the new
              cooperative mode called{' '}
              <a
                className={style.Link}
                href="https://reactjs.org/docs/concurrent-mode-intro.html">
                Concurrent Mode
              </a>
              .
              <br />
              <br />
              Import a captured{' '}
              <a
                className={style.Link}
                href="https://developers.google.com/web/tools/chrome-devtools/evaluate-performance">
                performance profile
              </a>{' '}
              from Chrome Devtools. To zoom, scroll while holding down{' '}
              <kbd>Ctrl</kbd> or <kbd>Shift</kbd>
            </p>

            <div className={style.Buttons}>
              <label htmlFor="upload">
                <button
                  className={style.ImportButton}
                  onClick={() => upload.current && upload.current.click()}>
                  Import
                </button>
                <input
                  type="file"
                  ref={upload}
                  className={style.ImportButtonFile}
                  onChange={handleProfilerInput}
                  accept="application/json"
                />
              </label>
              <a onClick={toggleModal}>
                <button className={style.HowToButton}>
                  <span>How-to </span>
                </button>
              </a>
            </div>
            <div
              className={`${style.ModalOverlay} ${
                showModal ? style.active : ''
              }`}>
              <div
                className={`${style.Modal}  ${showModal ? style.active : ''}`}>
                <a onClick={toggleModal} className={style.CloseModal}>
                  <svg viewBox="0 0 20 20">
                    <path
                      fill="#000000"
                      d="M15.898,4.045c-0.271-0.272-0.713-0.272-0.986,0l-4.71,4.711L5.493,4.045c-0.272-0.272-0.714-0.272-0.986,0s-0.272,0.714,0,0.986l4.709,4.711l-4.71,4.711c-0.272,0.271-0.272,0.713,0,0.986c0.136,0.136,0.314,0.203,0.492,0.203c0.179,0,0.357-0.067,0.493-0.203l4.711-4.711l4.71,4.711c0.137,0.136,0.314,0.203,0.494,0.203c0.178,0,0.355-0.067,0.492-0.203c0.273-0.273,0.273-0.715,0-0.986l-4.711-4.711l4.711-4.711C16.172,4.759,16.172,4.317,15.898,4.045z"
                    />
                  </svg>
                </a>
                {/* Modal Content */}
                <div className={style.ModalContent}>
                  <div className={style.cardcontainer}>
                    <h1>Getting Started</h1>

                    <div className={style.ModalRow}>
                      The event row displays React events and custom timing
                      marks. The gray bars show the lanes React was working in.
                      Hover over different measures to get more information.
                      <img
                        src={lanesImg}
                        className={style.ModalImg}
                        alt="Lanes Image"
                      />
                    </div>
                    <div className={style.ModalRow}>
                      Hover over the flamechart to get information about what
                      other bits of JavaScript the browser might be working on.
                      Similar colored flamecells represent work done from the
                      same URL.
                      <img
                        src={flamechartImg}
                        className={style.ModalImg}
                        alt="Flamechart Image"
                      />
                    </div>
                    <div className={style.ModalRow}>
                      Scroll while holding down <kbd>Ctrl</kbd> or{' '}
                      <kbd>Shift</kbd> to zoom. Drag the grey bar above the
                      flamechart to vertically resize sections.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
