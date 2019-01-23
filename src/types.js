// @flow

// TODO
export type Bridge = any;

// TODO
export type Hook = any;

export type Wall = {|
  listen: (fn: Function) => void,
  send: (data: any) => void,
|};
