/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule reactShowWarningDOM
 * @flow
 */
'use strict';

const React = require('React');
const ReactMount = require('ReactMount');

const ReactDOMYellowBoxRoot = require('ReactDOMYellowBoxRoot');

export type Format = string;
export type Instance = string;
export type Milliseconds = number;
export type InstanceInfo = {format: Format, instance: Instance};

type WarningStore = {
  instanceList: Array<InstanceInfo>,
  snoozeCache: {
    formatSnoozes: {
      [format: Format]: Milliseconds,
    },
    instanceSnoozes: {
      [instance: Instance]: Milliseconds,
    },
  },
};

const containerElemID = 'react.yellow_Box';
const localSnoozeDataKey = '_$reactYellowBoxSnoozeData';

const detectLocalStorage = (): boolean => {
  var testMsg = '_$detectLocalStorage';
  try {
    localStorage.setItem(testMsg, testMsg);
    localStorage.removeItem(testMsg);
    return true;
  } catch (e) {
    return false;
  }
};

const canUseLocalStorage = detectLocalStorage();

/*
 * we only save snooze data to localStorage.
 * here we read it from localStorage and remove expired timestamps
 */
const getAndUpdateWarningStore = (): WarningStore => {
  let snoozeCache = {
    formatSnoozes: {},
    instanceSnoozes: {},
  };

  if (canUseLocalStorage) {
    const rawSnoozeData = localStorage.getItem(localSnoozeDataKey);
    if (rawSnoozeData) {
      const localSnoozeData = JSON.parse(rawSnoozeData);
      const {formatSnoozes, instanceSnoozes} = localSnoozeData;
      const timeNow = Date.now();

      for (let format in formatSnoozes) {
        const until = formatSnoozes[format];
        if (timeNow < until) {
          // not expired; add it to the in-memory cache
          snoozeCache.formatSnoozes[format] = until;
        }
      }

      for (let instance in instanceSnoozes) {
        const until = instanceSnoozes[instance];
        if (timeNow < until) {
          // not expired; add it to the in-memory cache
          snoozeCache.instanceSnoozes[instance] = until;
        }
      }

      // remove expired records
      localStorage.setItem(
        localSnoozeDataKey,
        JSON.stringify(snoozeCache)
      );
    }
  }

  return {
    instanceList: [],
    snoozeCache,
  };
};

const warningStore = getAndUpdateWarningStore();

/*
 * updates the in-memory warningStore. doesn't touch the snooze part.
 */
const updateWarningStore = (
  instance: Instance,
  format: Format,
  args: Array<string>,
): void => {
  const {instanceList} = warningStore;

  for (let i = 0; i < instanceList.length; i++) {
    const cursor = instanceList[i];
    if (cursor.instance === instance) { // already exists
      return;
    }
  }

  instanceList.push({
    format,
    instance,
  });
};

/*
 * gets data for the Yellow Box component.
 * validates timestamps.
 */
const getDataFromWarningStore = (): Array<InstanceInfo> => {
  const timeNow = Date.now();

  const {instanceList, snoozeCache} = warningStore;
  const {formatSnoozes, instanceSnoozes} = snoozeCache;

  return instanceList.filter(({format, instance}) => {
    if (
      (instanceSnoozes[instance] && timeNow < instanceSnoozes[instance]) ||
      (formatSnoozes[format] && timeNow < formatSnoozes[format])
    ) {
      // still snoozing!
      return false;
    }

    return true;
  });
};

const unmountComponentAndRemoveElem = (containerElem: HTMLElement): void => {
  ReactMount.unmountComponentAtNode(containerElem);
  containerElem.remove();
};

const renderYellowBox = (): void => {
  const data = getDataFromWarningStore();

  let containerElem = document.getElementById(containerElemID);

  // unmounts Yellow Box when there's no warning to display
  if (!data.length) {
    if (containerElem) {
      unmountComponentAndRemoveElem(containerElem);
    }
    return;
  }

  if (!containerElem) {
    containerElem = document.createElement('div');
    containerElem.setAttribute('id', containerElemID);
    document.body.appendChild(containerElem);
  }

  const unmountYellowBox = () => unmountComponentAndRemoveElem(containerElem);

  /*
   * Warnings often happen during rendering and we must not
   * trigger a new render call from an ongoing rendering.
   */
  setTimeout(() => {
    ReactMount.render(
      <ReactDOMYellowBoxRoot
        data={data}
        onIgnoreAll={unmountYellowBox}
        onSnoozeByType={updateSnoozeForFormat}
        onSnoozeByInstance={updateSnoozeForInstance}
      />,
      containerElem
    );
  }, 0);
};

/*
 * updates the timestamp for a type of warning messages.
 * writes updated snooze data to localStorage.
 */
const updateSnoozeForFormat = (format: Format) => (snoozeDuration: Milliseconds): void => {
  warningStore.snoozeCache.formatSnoozes[format] = Date.now() + snoozeDuration;
  if (canUseLocalStorage) {
    localStorage.setItem(
      localSnoozeDataKey,
      JSON.stringify(warningStore.snoozeCache)
    );
  }
  renderYellowBox();
};

/*
 * updates the timestamp for a warning message instance.
 * writes updated snooze data to localStorage.
 */
const updateSnoozeForInstance = (instance: Instance) => (snoozeDuration: Milliseconds): void => {
  warningStore.snoozeCache.instanceSnoozes[instance] = Date.now() + snoozeDuration;
  if (canUseLocalStorage) {
    localStorage.setItem(
      localSnoozeDataKey,
      JSON.stringify(warningStore.snoozeCache)
    );
  }
  renderYellowBox();
};

/*
 * main entry for `warning` (fbjs) to call.
 */
const reactShowWarningDOM = ({message, format, args}: {
  message: Instance,
  format: Format,
  args: Array<string>,
}): void => {
  updateWarningStore(message, format, args);
  renderYellowBox();
};

module.exports = reactShowWarningDOM;
