'use strict';

let ReactFiberConfigDOM;

beforeEach(() => {
  jest.resetModules();
  ReactFiberConfigDOM = require('../client/ReactFiberConfigDOM');
});

test('measureClonedInstance adjusts x using RTL sign', () => {
  const instance = document.createElement('div');
  // Simulate the element being moved out of viewport by +20000 in RTL
  document.documentElement.dir = 'rtl';
  instance.getBoundingClientRect = () => new DOMRect(20100, 150, 50, 20);
  const measurement = ReactFiberConfigDOM.measureClonedInstance(instance);
  // Expect the x to be adjusted back to original (20100 - 20000)
  expect(measurement.rect.x).toBe(100);
  expect(measurement.rect.y).toBe(150 + 20000);

  // LTR case
  document.documentElement.dir = 'ltr';
  instance.getBoundingClientRect = () => new DOMRect(-19900, 250, 30, 10);
  const measurement2 = ReactFiberConfigDOM.measureClonedInstance(instance);
  expect(measurement2.rect.x).toBe(100);
  expect(measurement2.rect.y).toBe(250 + 20000);
});

test('moveOldFrameIntoViewport uses RTL-aware horizontal offset', () => {
  const keyframe = {transform: 'none'};
  const targetElement = document.createElement('div');

  document.documentElement.dir = 'ltr';
  ReactFiberConfigDOM.moveOldFrameIntoViewport(keyframe, targetElement);
  expect(keyframe.transform.startsWith('translate(20000px, 20000px)')).toBe(true);

  keyframe.transform = 'none';
  document.documentElement.dir = 'rtl';
  ReactFiberConfigDOM.moveOldFrameIntoViewport(keyframe, targetElement);
  expect(keyframe.transform.startsWith('translate(-20000px, 20000px)')).toBe(true);
});
