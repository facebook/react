// @flow

export type Bridge = {
  addListener(type: string, callback: Function): void,
  removeListener(type: string, callback: Function): void,
  send(event: string, payload: any, transferable?: Array<any>): void,
};

export type Wall = {|
  // `listen` returns the "unlisten" function.
  listen: (fn: Function) => Function,
  send: (event: string, payload: any, transferable?: Array<any>) => void,
|};
