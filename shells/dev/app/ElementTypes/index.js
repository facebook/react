// @flow

import React, {
  createContext,
  forwardRef,
  lazy,
  memo,
  Component,
  ConcurrentMode,
  Fragment,
  Profiler,
  StrictMode,
  Suspense,
} from 'react';

class ClassComponent extends Component {
  render() {
    return null;
  }
}

function FunctionComponent() {
  return null;
}

const MemoFunctionComponent = memo(FunctionComponent);

const ForwardRefComponent = forwardRef((props, ref) => (
  <ClassComponent ref={ref} {...props} />
));

const LazyComponent = lazy(() => Promise.resolve({
  default: FunctionComponent,
}));

export default function ElementTypes() {
  return (
    <Profiler id="test" onRender={() => {}}>
      <Fragment>
        <StrictMode>
          <ConcurrentMode>
            <Suspense fallback={<div>Loading...</div>}>
              <ClassComponent />
              <FunctionComponent />
              <MemoFunctionComponent />
              <ForwardRefComponent />
              <LazyComponent />
            </Suspense>
          </ConcurrentMode>
        </StrictMode>
      </Fragment>
    </Profiler>
  )
}