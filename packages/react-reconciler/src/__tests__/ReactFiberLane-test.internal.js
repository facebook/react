/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */
'use strict';

let ReactFiberLane;

describe('ReactFiberLane', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFiberLane = require('../ReactFiberLane');
  });

  describe('includesNonIdleWork', () => {
    const nonIdleLaneNames = [
      'DefaultHydrationLane',
      'SomeRetryLane',
      'SelectiveHydrationLane',
    ];

    nonIdleLaneNames.forEach(laneName => {
      it(`is true for ${laneName}`, () => {
        const lane = ReactFiberLane[laneName];
        expect(lane).toBeDefined();
        expect(ReactFiberLane.includesNonIdleWork(lane)).toEqual(true);
      });
    });

    const idleLaneNames = ['NoLane', 'OffscreenLane', 'IdleHydrationLane'];

    idleLaneNames.forEach(laneName => {
      it(`is false for ${laneName}`, () => {
        const lane = ReactFiberLane[laneName];
        expect(lane).toBeDefined();
        expect(ReactFiberLane.includesNonIdleWork(lane)).toEqual(false);
      });
    });
  });

  describe('includesOnlyRetries', () => {
    it('is true for a retry lane', () => {
      expect(
        ReactFiberLane.includesOnlyRetries(ReactFiberLane.SomeRetryLane),
      ).toEqual(true);
    });

    it('is false for the sync lane', () => {
      expect(
        ReactFiberLane.includesOnlyRetries(ReactFiberLane.SyncLane),
      ).toEqual(false);
    });

    it('is false for a retry lane merged with another lane', () => {
      const mergedLanes = ReactFiberLane.mergeLanes(
        ReactFiberLane.SyncLane,
        ReactFiberLane.SomeRetryLane,
      );
      expect(ReactFiberLane.includesOnlyRetries(mergedLanes)).toEqual(false);
    });
  });

  describe('includesSomeLane', () => {
    it('is true given the same lane', () => {
      const lane = ReactFiberLane.SyncLane;
      expect(ReactFiberLane.includesSomeLane(lane, lane)).toEqual(true);
    });

    it('is true given lanes that includes the other', () => {
      const lane = ReactFiberLane.SyncLane;
      const mergedLanes = ReactFiberLane.mergeLanes(
        lane,
        ReactFiberLane.DefaultHydrationLane,
      );

      expect(ReactFiberLane.includesSomeLane(mergedLanes, lane)).toEqual(true);
    });

    it('is false for two seperate lanes', () => {
      expect(
        ReactFiberLane.includesSomeLane(
          ReactFiberLane.SyncLane,
          ReactFiberLane.DefaultHydrationLane,
        ),
      ).toEqual(false);
    });
  });

  describe('isSubsetOfLanes', () => {
    it('is true given the same lane', () => {
      const lane = ReactFiberLane.SyncLane;
      expect(ReactFiberLane.isSubsetOfLanes(lane, lane)).toEqual(true);
    });

    it('is true given lanes that includes the other', () => {
      const subset = ReactFiberLane.mergeLanes(
        ReactFiberLane.SyncLane,
        ReactFiberLane.DefaultHydrationLane,
      );
      const mergedLanes = ReactFiberLane.mergeLanes(
        subset,
        ReactFiberLane.SyncBatchedLane,
      );

      expect(ReactFiberLane.includesSomeLane(mergedLanes, subset)).toEqual(
        true,
      );
    });

    it('is false for two seperate lanes', () => {
      expect(
        ReactFiberLane.includesSomeLane(
          ReactFiberLane.SyncLane,
          ReactFiberLane.DefaultHydrationLane,
        ),
      ).toEqual(false);
    });
  });

  describe('mergeLanes', () => {
    it('returns a lane that includes both inputs', () => {
      const laneA = ReactFiberLane.SyncLane;
      const laneB = ReactFiberLane.DefaultHydrationLane;

      const mergedLanes = ReactFiberLane.mergeLanes(laneA, laneB);

      expect(ReactFiberLane.includesSomeLane(mergedLanes, laneA)).toEqual(true);
      expect(ReactFiberLane.includesSomeLane(mergedLanes, laneB)).toEqual(true);
    });

    it('returns the same lane given two identical lanes', () => {
      const lane = ReactFiberLane.SyncLane;
      expect(ReactFiberLane.mergeLanes(lane, lane)).toEqual(lane);
    });
  });

  describe('removeLanes', () => {
    it('returns the lanes without the given lane', () => {
      const laneA = ReactFiberLane.SyncLane;
      const laneB = ReactFiberLane.DefaultHydrationLane;
      const mergedLanes = ReactFiberLane.mergeLanes(laneA, laneB);

      expect(ReactFiberLane.removeLanes(mergedLanes, laneA)).toEqual(laneB);
      expect(ReactFiberLane.removeLanes(mergedLanes, laneB)).toEqual(laneA);
    });

    it('returns the same lane when removing a lane not included', () => {
      const lanes = ReactFiberLane.mergeLanes(
        ReactFiberLane.SyncLane,
        ReactFiberLane.DefaultHydrationLane,
      );

      expect(
        ReactFiberLane.removeLanes(lanes, ReactFiberLane.SyncBatchedLane),
      ).toEqual(lanes);
    });
  });

  describe('higherPriorityLane', () => {
    it('returns the other lane if one is NoLane', () => {
      const lane = ReactFiberLane.SyncLane;

      expect(
        ReactFiberLane.higherPriorityLane(ReactFiberLane.NoLane, lane),
      ).toEqual(lane);
      expect(
        ReactFiberLane.higherPriorityLane(lane, ReactFiberLane.NoLane),
      ).toEqual(lane);
    });

    it('returns the higher priority lane', () => {
      const higherLane = ReactFiberLane.SyncLane;
      const otherLane = ReactFiberLane.OffscreenLane;
      expect(ReactFiberLane.higherPriorityLane(higherLane, otherLane)).toEqual(
        higherLane,
      );
      expect(ReactFiberLane.higherPriorityLane(otherLane, higherLane)).toEqual(
        higherLane,
      );
    });
  });
});
