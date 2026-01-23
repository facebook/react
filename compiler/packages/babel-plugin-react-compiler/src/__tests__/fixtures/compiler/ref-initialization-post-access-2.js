//@flow
import {useRef} from 'react';

/**
 * Allowed: we aren't sure that the ref.current value flows into the render
 * output, so we optimistically assume it's safe
 */
component C() {
  const r = useRef(null);
  if (r.current == null) {
    r.current = 1;
  }
  f(r.current);
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{}],
};
