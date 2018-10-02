/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

import jestDiff from 'jest-diff';
import chalk from 'chalk';

type JestResponse = {|
  message?: () => string,
  pass: boolean,
|};

// Mirrors the Interaction type in scheduler/tracing
type Interaction = {|
  __count: number,
  id: number,
  name: string,
  timestamp: number,
|};

// Mirrors the Interaction type in scheduler/tracing
type Subscriber = {
  onInteractionTraced: (interaction: Interaction) => void,
  onInteractionScheduledWorkCompleted: (interaction: Interaction) => void,
  onWorkScheduled: (interactions: Set<Interaction>, threadID: number) => void,
  onWorkCanceled: (interactions: Set<Interaction>, threadID: number) => void,
  onWorkStarted: (interactions: Set<Interaction>, threadID: number) => void,
  onWorkStopped: (interactions: Set<Interaction>, threadID: number) => void,
};

type InteractionOrName = Interaction | string;
type InteractionSetOrArray = Set<InteractionOrName> | Array<InteractionOrName>;

function getInteractionNameHelper(interaction: InteractionOrName) {
  return typeof interaction === 'string' ? interaction : interaction.name;
}

function mapExpectedInteractionsToNamesHelper(
  interactions: Array<InteractionOrName>,
) {
  return interactions.map(getInteractionNameHelper);
}

function mapActualInteractionsToNamesHelper(interactions: Array<Interaction>) {
  return interactions.map(interaction => interaction.name);
}

export function toMatchInteraction(
  maybeActualInteraction: ?Interaction,
  expectedStringOrObject: InteractionOrName,
): JestResponse {
  if (maybeActualInteraction == null) {
    return {
      message: () =>
        `No interaction was traced.\n\n` +
        jestDiff(expectedStringOrObject, maybeActualInteraction),
      pass: false,
    };
  }

  const actualInteraction = ((maybeActualInteraction: any): Interaction);
  if (typeof expectedStringOrObject === 'string') {
    if (expectedStringOrObject !== actualInteraction.name) {
      return {
        message: () =>
          jestDiff(
            {name: expectedStringOrObject},
            {name: actualInteraction.name},
          ),
        pass: false,
      };
    }
  } else {
    let attribute;
    for (attribute in expectedStringOrObject) {
      if (actualInteraction[attribute] !== expectedStringOrObject[attribute]) {
        return {
          message: () =>
            jestDiff(
              expectedStringOrObject,
              Object.keys(((expectedStringOrObject: any): Object)).reduce(
                (reduced, key) => ({
                  ...reduced,
                  [key]: actualInteraction[key],
                }),
                {},
              ),
            ),
          pass: false,
        };
      }
    }
  }

  return {
    message: () =>
      `Expected not to have been last traced with interaction.\n\n  ${chalk.red(
        getInteractionNameHelper(expectedStringOrObject),
      )}`,
    pass: true,
  };
}

export function toMatchInteractions(
  actual: Set<Interaction>,
  expected: InteractionSetOrArray,
): JestResponse {
  const actualArray: Array<Interaction> = Array.from(actual);
  const expectedArray: Array<InteractionOrName> = Array.from(expected);

  if (actualArray.length !== expectedArray.length) {
    return {
      message: () =>
        `Expected ${chalk.green(
          '' + expectedArray.length,
        )} interactions but there were ${chalk.red('' + actualArray.length)}`,
      pass: false,
    };
  }

  for (let i = 0; i < actualArray.length; i++) {
    const result = toMatchInteraction(actualArray[i], expectedArray[i]);
    if (result.pass === false) {
      return result;
    }
  }

  return {
    message: () =>
      `Expected not to match interactions.\n\n  ${chalk.red(
        mapActualInteractionsToNamesHelper(actualArray),
      )}`,
    pass: true,
  };
}

export function toHaveBeenTracedWith(
  actualSet: Set<Interaction>,
  expected?: InteractionSetOrArray,
): JestResponse {
  const actualArray: Array<Interaction> = Array.from(actualSet);
  const expectedArray: Array<InteractionOrName> = Array.from(expected || []);

  let i;
  if (this.isNot) {
    if (expected === undefined) {
      if (actualArray.length > 0) {
        return {
          message: () =>
            `Expected not to have been traced with any interactions.\n\nDifference:\n\n` +
            jestDiff([], mapActualInteractionsToNamesHelper(actualArray)),
          pass: true,
        };
      }
    } else {
      for (i = 0; i < expectedArray.length; i++) {
        const result = toMatchInteraction(actualArray[i], expectedArray[i]);
        if (result.pass === true) {
          return {
            message: () =>
              `Expected not to have been traced with interaction:\n\n  ${chalk.red(
                getInteractionNameHelper(actualArray[i]),
              )}`,
            pass: true,
          };
        }
      }
    }

    return {pass: false};
  } else {
    if (actualArray.length !== expectedArray.length) {
      return {
        message: () =>
          `Expected number of interactions:\n  ${chalk.green(
            '' + expectedArray.length,
          )}\nReceived:\n  ${chalk.red(
            '' + actualArray.length,
          )}\n\nDifference:\n\n` +
          jestDiff(
            mapExpectedInteractionsToNamesHelper(expectedArray),
            mapActualInteractionsToNamesHelper(actualArray),
          ),
        pass: false,
      };
    }

    for (i = 0; i < actualArray.length; i++) {
      const result = toMatchInteraction(actualArray[i], expectedArray[i]);
      if (result.pass === false) {
        return result;
      }
    }

    return {pass: true};
  }
}

function validateSubscriber(subscriber) {
  if (
    subscriber === null ||
    typeof subscriber !== 'object' ||
    typeof subscriber.onInteractionScheduledWorkCompleted !== 'function' ||
    typeof subscriber.onInteractionTraced !== 'function' ||
    typeof subscriber.onWorkCanceled !== 'function' ||
    typeof subscriber.onWorkScheduled !== 'function' ||
    typeof subscriber.onWorkStarted !== 'function' ||
    typeof subscriber.onWorkStopped !== 'function'
  ) {
    throw Error('Invalid subscriber provided. TODO add a better message.');
  }
}

function toHaveBeenNotifiedOfInteractionHelper(mock, expectedArray) {
  const actual = mock.calls.map(call => call[0]);
  return toHaveBeenTracedWith.call(this, actual, expectedArray);
}

export function toHaveBeenNotifiedOfInteractionsTraced(
  subscriber: Subscriber,
  expectedArray: Array<InteractionOrName>,
): JestResponse {
  validateSubscriber(subscriber);
  return toHaveBeenNotifiedOfInteractionHelper.call(
    this,
    subscriber.onInteractionTraced.mock,
    expectedArray,
  );
}

export function toHaveBeenNotifiedOfInteractionsScheduledWorkCompleted(
  subscriber: Subscriber,
  expectedArray: Array<InteractionOrName>,
): JestResponse {
  validateSubscriber(subscriber);
  return toHaveBeenNotifiedOfInteractionHelper.call(
    this,
    subscriber.onInteractionScheduledWorkCompleted.mock,
    expectedArray,
  );
}

function toHaveBeenLastNotifiedOfInteractionHelper(
  mock,
  expectedInteractionOrName,
) {
  const actualInteraction =
    mock.calls.length > 0 ? mock.calls[mock.calls.length - 1][0] : undefined;
  return toMatchInteraction.call(
    this,
    actualInteraction,
    expectedInteractionOrName,
  );
}

export function toHaveBeenLastNotifiedOfInteractionTraced(
  subscriber: Subscriber,
  expectedInteractionOrName: InteractionOrName,
): JestResponse {
  validateSubscriber(subscriber);
  return toHaveBeenLastNotifiedOfInteractionHelper.call(
    this,
    subscriber.onInteractionTraced.mock,
    expectedInteractionOrName,
  );
}

export function toHaveBeenLastNotifiedOfInteractionsScheduledWorkCompleted(
  subscriber: Subscriber,
  expectedInteractionOrName: InteractionOrName,
): JestResponse {
  validateSubscriber(subscriber);
  return toHaveBeenLastNotifiedOfInteractionHelper.call(
    this,
    subscriber.onInteractionScheduledWorkCompleted.mock,
    expectedInteractionOrName,
  );
}

function toHaveBeenLastNotifiedOfWorkHelper(
  mock,
  expected: InteractionSetOrArray,
) {
  const actualInteractions =
    mock.calls.length > 0 ? mock.calls[mock.calls.length - 1][0] : new Set();
  return toMatchInteractions.call(this, actualInteractions, expected);
}

export function toHaveBeenLastNotifiedOfWorkCanceled(
  subscriber: Subscriber,
  expected: InteractionSetOrArray,
): JestResponse {
  validateSubscriber(subscriber);
  return toHaveBeenLastNotifiedOfWorkHelper.call(
    this,
    subscriber.onWorkCanceled.mock,
    expected,
  );
}

export function toHaveBeenLastNotifiedOfWorkScheduled(
  subscriber: Subscriber,
  expected: InteractionSetOrArray,
): JestResponse {
  validateSubscriber(subscriber);
  return toHaveBeenLastNotifiedOfWorkHelper.call(
    this,
    subscriber.onWorkScheduled.mock,
    expected,
  );
}

export function toHaveBeenLastNotifiedOfWorkStarted(
  subscriber: Subscriber,
  expected: InteractionSetOrArray,
): JestResponse {
  validateSubscriber(subscriber);
  return toHaveBeenLastNotifiedOfWorkHelper.call(
    this,
    subscriber.onWorkStarted.mock,
    expected,
  );
}

export function toHaveBeenLastNotifiedOfWorkStopped(
  subscriber: Subscriber,
  expected: InteractionSetOrArray,
): JestResponse {
  validateSubscriber(subscriber);
  return toHaveBeenLastNotifiedOfWorkHelper.call(
    this,
    subscriber.onWorkStopped.mock,
    expected,
  );
}
