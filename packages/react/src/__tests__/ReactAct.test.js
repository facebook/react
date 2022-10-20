import ReactCurrentActQueue from '../ReactCurrentActQueue';
import {act} from '../ReactAct';

describe('act', () => {
  (__DEV__ ? it : it.skip)(
    'If something throws, leave the remaining callbacks on the queue.',
    () => {
      ReactCurrentActQueue.current = [
        () => null,
        () => {
          throw new Error();
        },
        () => null,
      ];
      ReactCurrentActQueue.didScheduleLegacyUpdate = true;

      try {
        act(() => {});
      } catch {}

      expect(ReactCurrentActQueue.current.length).toBe(1);
    },
  );
});
