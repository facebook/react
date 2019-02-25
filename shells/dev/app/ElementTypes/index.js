// @flow

import React, {
  createContext,
  forwardRef,
  lazy,
  memo,
  Component,
  // $FlowFixMe Flow thinks ConcurrentMode is stable
  unstable_ConcurrentMode as ConcurrentMode,
  Fragment,
  // $FlowFixMe Flow doesn't know about the Profiler import yet
  unstable_Profiler as Profiler,
  StrictMode,
  Suspense,
} from 'react';

const Context = createContext('abc');
Context.displayName = 'ExampleContext';

class ClassComponent extends Component<any> {
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

const LazyComponent = lazy(() =>
  Promise.resolve({
    default: FunctionComponent,
  })
);

export default function ElementTypes() {
  return (
    <Profiler id="test" onRender={() => {}}>
      <Fragment>
        <Context.Provider value={'def'}>
          <Context.Consumer>{value => null}</Context.Consumer>
        </Context.Provider>
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
  );
}
