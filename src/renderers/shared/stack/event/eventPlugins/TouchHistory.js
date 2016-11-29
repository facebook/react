/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule TouchHistory
 * @flow
 */

'use strict';

const EventPluginUtils = require('EventPluginUtils');

const invariant = require('invariant');
const warning = require('warning');

const {
  isEndish,
  isMoveish,
  isStartish,
} = EventPluginUtils;

export type Touch = {
  identifier: ?number,
  pageX: number,
  pageY: number,
  timestamp: number,
};

export type TouchEvent = {
  changedTouches: Array<Touch>,
  touches: Array<Touch>,
};

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

type TouchBank = Array<TouchRecord>;

const MAX_TOUCH_BANK = 20;

class TouchHistory {
  constructor() {
    this.touchBank = [];
    this.numberActiveTouches = 0;
    // If there is only one active touch, we remember its location. This prevents
    // us having to loop through all of the touches all the time in the most
    // common case.
    this.indexOfSingleActiveTouch = -1;
    this.mostRecentTimeStamp = 0;
  }

  recordTouchEvent(topLevelType: string, changedTouches: Array<Touch>): void {
    if (isMoveish(topLevelType)) {
      changedTouches.forEach(touch => this._recordTouchMove(touch));
    } else if (isStartish(topLevelType)) {
      changedTouches.forEach(touch => this._recordTouchStart(touch));
      if (this.numberActiveTouches === 1) {
        this.indexOfSingleActiveTouch =
          changedTouches[0].identifier;
      }
    } else if (isEndish(topLevelType)) {
      changedTouches.forEach(touch => this._recordTouchEnd(touch));
      if (this.numberActiveTouches === 1) {
        for (let i = 0; i < this.touchBank.length; i++) {
          const touchTrackToCheck = this.touchBank[i];
          if (touchTrackToCheck != null && touchTrackToCheck.touchActive) {
            this.indexOfSingleActiveTouch = i;
            break;
          }
        }
        if (__DEV__) {
          const activeRecord = this.touchBank[this.indexOfSingleActiveTouch];
          warning(
            activeRecord != null &&
            activeRecord.touchActive,
            'Cannot find single active touch.'
          );
        }
      }
    }
  }

  _recordTouchStart(touch: Touch): void {
    const identifier = getTouchIdentifier(touch);
    const touchRecord = this.touchBank[identifier];
    if (touchRecord) {
      resetTouchRecord(touchRecord, touch);
    } else {
      this.touchBank[identifier] = createTouchRecord(touch);
    }
    this.mostRecentTimeStamp = timestampForTouch(touch);
    this.numberActiveTouches += 1;
  }

  _recordTouchMove(touch: Touch): void {
    const touchRecord = this.touchBank[getTouchIdentifier(touch)];
    if (touchRecord) {
      touchRecord.touchActive = true;
      touchRecord.previousPageX = touchRecord.currentPageX;
      touchRecord.previousPageY = touchRecord.currentPageY;
      touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
      touchRecord.currentPageX = touch.pageX;
      touchRecord.currentPageY = touch.pageY;
      touchRecord.currentTimeStamp = timestampForTouch(touch);
      this.mostRecentTimeStamp = timestampForTouch(touch);
    } else {
      console.error(
        'Cannot record touch move without a touch start.\n' +
        'Touch Move: %s\n',
        'Touch Bank: %s',
        printTouch(touch),
        printTouchBank(this.touchBank)
      );
    }
  }

  _recordTouchEnd(touch: Touch): void {
    const touchRecord = this.touchBank[getTouchIdentifier(touch)];
    if (touchRecord) {
      this.numberActiveTouches -= 1;
      touchRecord.touchActive = false;
      touchRecord.previousPageX = touchRecord.currentPageX;
      touchRecord.previousPageY = touchRecord.currentPageY;
      touchRecord.previousTimeStamp = touchRecord.currentTimeStamp;
      touchRecord.currentPageX = touch.pageX;
      touchRecord.currentPageY = touch.pageY;
      touchRecord.currentTimeStamp = timestampForTouch(touch);
      this.mostRecentTimeStamp = timestampForTouch(touch);
    } else {
      console.error(
        'Cannot record touch end without a touch start.\n' +
        'Touch End: %s\n',
        'Touch Bank: %s',
        printTouch(touch),
        printTouchBank(this.touchBank)
      );
    }
  }
}

module.exports = TouchHistory;

function timestampForTouch(touch: Touch): number {
  // The legacy internal implementation provides "timeStamp", which has been
  // renamed to "timestamp". Let both work for now while we iron it out
  // TODO (evv): rename timeStamp to timestamp in internal code
  return (touch: any).timeStamp || touch.timestamp;
}

function getTouchIdentifier({identifier}: Touch): number {
  invariant(identifier != null, 'Touch object is missing identifier.');
  warning(
    identifier <= MAX_TOUCH_BANK,
    'Touch identifier %s is greater than maximum supported %s which causes ' +
    'performance issues backfilling array locations for all of the indices.',
    identifier,
    MAX_TOUCH_BANK
  );
  return identifier;
}

function printTouch(touch: Touch): string {
  return JSON.stringify({
    identifier: touch.identifier,
    pageX: touch.pageX,
    pageY: touch.pageY,
    timestamp: timestampForTouch(touch),
  });
}

function printTouchBank(touchBank: TouchBank): string {
  let printed = JSON.stringify(touchBank.slice(0, MAX_TOUCH_BANK));
  if (touchBank.length > MAX_TOUCH_BANK) {
    printed += ' (original size: ' + touchBank.length + ')';
  }
  return printed;
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
