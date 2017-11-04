/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule ReactNativeCSTypes
 */

/**
 * Flat CS renderer bundles are too big for Flow to parse efficiently.
 * Provide minimal Flow typing for the high-level API and call it a day.
 */

import type {Options, Element} from 'CSComponent';

export type Children<ChildType> = {|
  +children: $ReadOnlyArray<React$Element<ChildType>>,
|};

type StatelessComponent<Props> = React$StatelessFunctionalComponent<Props>;

type ClassComponent<Props, Instance> = Class<React$Component<Props> & Instance>;

export type ReactNativeCSType = <Props, Instance>(
  props: Children<ClassComponent<Props, Instance> | StatelessComponent<Props>>,
  options: Options<Instance> | void,
) => Element;
