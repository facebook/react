/*!
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * TypeScript Definition File for React.
 *
 * Full type definitions are not yet officially supported. These are mostly
 * just helpers for the unit test.
 */

declare let global: any;

declare module 'react' {
  export class Component {
    props: any;
    state: any;
    context: any;
    static name: string;
    constructor(props?, context?);
    setState(partial : any, callback ?: any) : void;
    forceUpdate(callback ?: any) : void;
  }
  export let PropTypes : any;
  export function createElement(tag : any, props ?: any, ...children : any[]) : any
  export function createRef(): any;
}
