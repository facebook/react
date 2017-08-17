/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ResponderTouchHistoryStore
 * @flow
 */

'use strict';

const EventPluginUtils = require('EventPluginUtils');

const invariant = require('fbjs/lib/invariant');

const {isEndish, isMoveish, isStartish} = EventPluginUtils;

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
}

/**
 * Tracks the position and time of each active touch by `touch.identifier`. We
 * should typically only see IDs in the range of 1-20 because IDs get recycled
 * when touches end and start again.
 */
type TouchRecord = {
  touchActive: boolean,
  startPageX: number,
  startPageY: number,
  startTimeStamp: number,
  currentPageX: number,
  currentPageY: number,
  currentTimeStamp: number,
  previousPageX: number,
  previousPageY: number,
  previousTimeStamp: number,
};

const MAX_TOUCH_BANK = 20;
const touchBank: Array<TouchRecord> = [];
const touchHistory = {
  touchBank,
  numberActiveTouches: 0,
  // If there is only one active touch, we remember its location. This prevents
  // us having to loop through all of the touches all the time in the most
  // common case.
  indexOfSingleActiveTouch: -1,
  mostRecentTimeStamp: 0,
};

type Touch = {
  identifier: ?number,
  pageX: number,
  pageY: number,
  timestamp: number,
};
type TouchEvent = {
  changedTouches: Array<Touch>,
  touches: Array<Touch>,
};

function timestampForTouch(touch: Touch): number {
  // The legacy internal implementation provides "timeStamp", which has been
  // renamed to "timestamp". Let both work for now while we iron it out
  // TODO (evv): rename timeStamp to timestamp in internal code
  return (touch: any).timeStamp || touch.timestamp;
}

/**
 * TODO: Instead of making gestures recompute filtered velocity, we could
 * include a built in velocity computation that can be reused globally.
 */
function createTouchRecord(touch: Touch): TouchRecord {
  return {
    touchActive: true,
    startPageX: touch.pageX,
    startPageY: touch.pageY,
    startTimeStamp: timestampForTouch(touch),
    currentPageX: touch.pageX,
    currentPageY: touch.pageY,
    currentTimeStamp: timestampForTouch(touch),
    previousPageX: touch.pageX,
    previousPageY: touch.pageY,
    previousTimeStamp: timestampForTouch(touch),
  };
}

function resetTouchRecord(touchRecord: TouchRecord, touch: Touch): void {
  touchRecord.touchActive = true;
  touchRecord.startPageX = touch.pageX;
  touchRecord.startPageY = touch.pageY;
  touchRecord.startTimeStamp = timestampForTouch(touch);
  touchRecord.currentPageX = touch.pageX;
  touchRecord.currentPageY = touch.pageY;
  touchRecord.currentTimeStamp = timestampForTouch(touch);
  touchRecord.previousPageX = touch.pageX;
  touchRecord.previousPageY = touch.pageY;
  touchRecord.previousTimeStamp = timestampForTouch(touch);
}

function getTouchIdentifier({identifier}: Touch): number {
  invariant(identifier != null, 'Touch object is missing identifier.');
  if (__DEV__) {
    warning(
      identifier <= MAX_TOUCH_BANK,
      'Touch identifier %s is greater than maximum supported %s which causes ' +
        'performance issues backfilling array locations for all of the indices.',
      identifier,
      MAX_TOUCH_BANK,
    );
  }
  return identifier;
}

function recordTouchStart(touch: Touch): void {
  const identifier = getTouchIdentifier(touch);
  const touchRecord = touchBank[identifier];
  if (touchRecord) {
    resetTouchRecord(touchRecord, touch);
  } else {
    touchBank[identifier] = createTouchRecord(touch);
  }
  touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
}

function recordTouchMove(touch: Touch): void {
  const touchRecord = touchBank[getTouchIdentifier(touch)];
  if (touchRecord) {
    touchRecord.touchActive = true;
    touchRecord.previousPageX = touchRecord.currentPageX;
    touchRecord.previousPageY = touchRecord.currentPageY;
    touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
    touchRecord.currentPageX = touch.pageX;
    touchRecord.currentPageY = touch.pageY;
    touchRecord.currentTimeStamp = timestampForTouch(touch);
    touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
  } else {
    console.error(
      'Cannot record touch move without a touch start.\n' + 'Touch Move: %s\n',
      'Touch Bank: %s',
      printTouch(touch),
      printTouchBank(),
    );
  }
}

function recordTouchEnd(touch: Touch): void {
  const touchRecord = touchBank[getTouchIdentifier(touch)];
  if (touchRecord) {
    touchRecord.touchActive = false;
    touchRecord.previousPageX = touchRecord.currentPageX;
    touchRecord.previousPageY = touchRecord.currentPageY;
    touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
    touchRecord.currentPageX = touch.pageX;
    touchRecord.currentPageY = touch.pageY;
    touchRecord.currentTimeStamp = timestampForTouch(touch);
    touchHistory.mostRecentTimeStamp = timestampForTouch(touch);
  } else {
    console.error(
      'Cannot record touch end without a touch start.\n' + 'Touch End: %s\n',
      'Touch Bank: %s',
      printTouch(touch),
      printTouchBank(),
    );
  }
}

function printTouch(touch: Touch): string {
  return JSON.stringify({
    identifier: touch.identifier,
    pageX: touch.pageX,
    pageY: touch.pageY,
    timestamp: timestampForTouch(touch),
  });
}

function printTouchBank(): string {
  let printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));
  if (touchBank.length > MAX_TOUCH_BANK) {
    printed += ' (original size: ' + touchBank.length + ')';
  }
  return printed;
}

const ResponderTouchHistoryStore = {
  recordTouchTrack(topLevelType: string, nativeEvent: TouchEvent): void {
    if (isMoveish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchMove);
    } else if (isStartish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchStart);
      touchHistory.numberActiveTouches = nativeEvent.touches.length;
      if (touchHistory.numberActiveTouches === 1) {
        touchHistory.indexOfSingleActiveTouch =
          nativeEvent.touches[0].identifier;
      }
    } else if (isEndish(topLevelType)) {
      nativeEvent.changedTouches.forEach(recordTouchEnd);
      touchHistory.numberActiveTouches = nativeEvent.touches.length;
      if (touchHistory.numberActiveTouches === 1) {
        for (let i = 0; i < touchBank.length; i++) {
          const touchTrackToCheck = touchBank[i];
          if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
            touchHistory.indexOfSingleActiveTouch = i;
            break;
          }
        }
        if (__DEV__) {
          const activeRecord = touchBank[touchHistory.indexOfSingleActiveTouch];
          warning(
            activeRecord != null && activeRecord.touchActive,
            'Cannot find single active touch.',
          );
        }
      }
    }
  },

  touchHistory,
};

module.exports = ResponderTouchHistoryStore;
