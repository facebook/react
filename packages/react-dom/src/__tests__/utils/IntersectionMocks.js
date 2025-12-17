/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const intersectionObserverMock = {callback: null, observedTargets: []};

/**
 * This is a broken polyfill.
 * It is only intended to provide bare minimum test coverage.
 * More meaningful tests will require the use of fixtures.
 */
export function mockIntersectionObserver() {
  intersectionObserverMock.callback = null;
  intersectionObserverMock.observedTargets = [];

  class IntersectionObserver {
    constructor() {
      intersectionObserverMock.callback = arguments[0];
    }

    disconnect() {
      intersectionObserverMock.callback = null;
      intersectionObserverMock.observedTargets.splice(0);
    }

    observe(target) {
      intersectionObserverMock.observedTargets.push(target);
    }

    unobserve(target) {
      const index = intersectionObserverMock.observedTargets.indexOf(target);
      if (index >= 0) {
        intersectionObserverMock.observedTargets.splice(index, 1);
      }
    }
  }

  window.IntersectionObserver = IntersectionObserver;

  return intersectionObserverMock;
}

export function simulateIntersection(...entries) {
  intersectionObserverMock.callback(
    entries.map(([target, rect, ratio]) => ({
      boundingClientRect: {
        top: rect.y,
        left: rect.x,
        width: rect.width,
        height: rect.height,
      },
      intersectionRatio: ratio,
      target,
    })),
  );
}

/**
 * Stub out getBoundingClientRect for the specified target.
 * This API is required by the test selectors but it isn't implemented by jsdom.
 */
export function setBoundingClientRect(target, {x, y, width, height}) {
  target.getBoundingClientRect = function () {
    return {
      width,
      height,
      left: x,
      right: x + width,
      top: y,
      bottom: y + height,
    };
  };
}

/**
 * Stub out getClientRects for the specified target.
 */
export function setClientRects(target, rects) {
  target.getClientRects = function () {
    return rects.map(({x, y, width, height}) => ({
      width,
      height,
      left: x,
      right: x + width,
      top: y,
      bottom: y + height,
      x,
      y,
    }));
  };
}
