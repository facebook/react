import {fn} from 'lib';

function Component1() {
  const value = fn();
  return <div>{Math.floor(Math.abs(value))}</div>;
}

function Component2() {
  const value = fn();
  return <div>{Math.ceil(Math.abs(value))}</div>;
}

function Component3() {
  const value = fn();
  return <div>{Math.max(Math.abs(value), 0)}</div>;
}

// Test deeper nesting - 3 levels
function DeepNested1() {
  const value = fn();
  return <div>{Math.round(Math.floor(Math.abs(value)))}</div>;
}

// Test deeper nesting - 4 levels
function DeepNested2() {
  const value = fn();
  return <div>{Math.max(Math.min(Math.floor(Math.abs(value)), 100), 0)}</div>;
}

// Test with array methods
function ArrayMethods() {
  const arr = fn();
  const index = fn();
  return <div>{arr.slice(0, Math.abs(index))}</div>;
}

// Test with custom object methods
function CustomMethods() {
  const obj = fn();
  const param = fn();
  return <div>{obj.method1(obj.method2(param))}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component1,
  params: [],
  isComponent: true,
};
