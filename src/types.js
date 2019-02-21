// @flow

export type Bridge = {
  addListener(type: string, callback: Function): void,
  removeListener(type: string, callback: Function): void,
  send(event: string, payload: any, transferable?: Array<any>): void,
};

export type Wall = {|
  listen: (fn: Function) => void,
  send: (event: string, payload: any, transferable?: Array<any>) => void,
|};
