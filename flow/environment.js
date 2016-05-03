/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* eslint-disable */

declare var __REACT_DEVTOOLS_GLOBAL_HOOK__: any; /*?{
  inject: ?((stuff: Object) => void)
};*/

// temporary patches for React.Component and React.Element
declare var ReactComponent: typeof React$Component;
declare var ReactElement: typeof React$Element;
