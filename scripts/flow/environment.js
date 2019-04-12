/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-disable */

declare var __PROFILE__: boolean;
declare var __UMD__: boolean;

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: any; /*?{
  inject: ?((stuff: Object) => void)
};*/

// ReactFeatureFlags www fork
declare module 'ReactFeatureFlags' {
  declare module.exports: any;
}

// ReactFiberErrorDialog www fork
declare module 'ReactFiberErrorDialog' {
  declare module.exports: {
    showErrorDialog: (error: mixed) => boolean,
  };
}

// EventListener www fork
declare module 'EventListener' {
  declare module.exports: {
    listen: (
      target: Element,
      type: string,
      callback: Function,
      priority?: number,
      options?: {passive: boolean},
    ) => mixed,
    capture: (target: Element, type: string, callback: Function) => mixed,
  };
}

// Libdefs for Scheduler

declare module 'scheduler/tracing' {
  declare type Interaction = {|
    __count: number,
    id: number,
    name: string,
    timestamp: number,
  |};

  declare type Subscriber = {
    // A new interaction has been created via the trace() method.
    onInteractionTraced: (interaction: Interaction) => void,

    // All scheduled async work for an interaction has finished.
    onInteractionScheduledWorkCompleted: (interaction: Interaction) => void,

    // New async work has been scheduled for a set of interactions.
    // When this work is later run, onWorkStarted/onWorkStopped will be called.
    // A batch of async/yieldy work may be scheduled multiple times before completing.
    // In that case, onWorkScheduled may be called more than once before onWorkStopped.
    // Work is scheduled by a "thread" which is identified by a unique ID.
    onWorkScheduled: (interactions: Set<Interaction>, threadID: number) => void,

    // A batch of scheduled work has been canceled.
    // Work is done by a "thread" which is identified by a unique ID.
    onWorkCanceled: (interactions: Set<Interaction>, threadID: number) => void,

    // A batch of work has started for a set of interactions.
    // When this work is complete, onWorkStopped will be called.
    // Work is not always completed synchronously; yielding may occur in between.
    // A batch of async/yieldy work may also be re-started before completing.
    // In that case, onWorkStarted may be called more than once before onWorkStopped.
    // Work is done by a "thread" which is identified by a unique ID.
    onWorkStarted: (interactions: Set<Interaction>, threadID: number) => void,

    // A batch of work has completed for a set of interactions.
    // Work is done by a "thread" which is identified by a unique ID.
    onWorkStopped: (interactions: Set<Interaction>, threadID: number) => void,
  };

  declare type InteractionsRef = {
    current: Set<Interaction>,
  };

  declare type SubscriberRef = {
    current: Subscriber | null,
  };

  declare var __interactionsRef: InteractionsRef;
  declare var __subscriberRef: SubscriberRef;

  declare function unstable_clear(callback: Function): any;

  declare function unstable_getCurrent(): Set<Interaction> | null;

  declare function unstable_getThreadID(): number;

  declare function unstable_trace(
    name: string,
    timestamp: number,
    callback: Function,
    threadID: number,
  ): any;

  declare function unstable_wrap(
    callback: Function,
    threadID?: number,
  ): Function;

  declare function unstable_subscribe(subscriber: Subscriber): void;

  declare function unstable_unsubscribe(subscriber: Subscriber): void;
}
