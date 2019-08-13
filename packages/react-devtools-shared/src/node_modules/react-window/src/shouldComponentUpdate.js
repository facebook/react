// @flow

import areEqual from './areEqual';
import shallowDiffers from './shallowDiffers';

// Custom shouldComponentUpdate for class components.
// It knows to compare individual style props and ignore the wrapper object.
// See https://reactjs.org/docs/react-component.html#shouldcomponentupdate
export default function shouldComponentUpdate(
  nextProps: Object,
  nextState: Object
): boolean {
  return (
    !areEqual(this.props, nextProps) || shallowDiffers(this.state, nextState)
  );
}
