/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import ReactShallowRenderer from 'react-shallow-renderer';
import {enableReactTestRendererWarning} from 'shared/ReactFeatureFlags';

let Renderer = ReactShallowRenderer;

if (enableReactTestRendererWarning === true) {
  const emptyObject = {};
  Renderer = class ReactShallowRendererWithWarning extends (
    ReactShallowRenderer
  ) {
    render(element, context = emptyObject) {
      if (__DEV__) {
        console.warn(
          'react-test-renderer is deprecated. See https://react.dev/warnings/react-test-renderer',
        );
      }

      return super.render(element, context);
    }
  };
}

export default Renderer;
