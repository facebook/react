/*!
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * TypeScript Definition File for React.
 *
 * Full type definitions are not yet officially supported. These are mostly
 * just helpers for the unit test.
 */

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
  export var PropTypes : any;
  export function createElement(tag : any, props ?: any, ...children : any[]) : any
}
