'use strict';

export function patchMessageChannel(Scheduler) {
  global.MessageChannel = class {
    constructor() {
      const port1 = {
        onmesssage: () => {},
      };

      this.port1 = port1;

      this.port2 = {
        postMessage(msg) {
          if (Scheduler) {
            Scheduler.unstable_scheduleCallback(
              Scheduler.unstable_NormalPriority,
              () => {
                port1.onmessage(msg);
              }
            );
          } else {
            throw new Error(
              'MessageChannel patch was used without providing a Scheduler implementation. This is useful for tests that require this class to exist but are not actually utilizing the MessageChannel class. However it appears some test is trying to use this class so you should pass a Scheduler implemenation to the patch method'
            );
          }
        },
      };
    }
  };
}
