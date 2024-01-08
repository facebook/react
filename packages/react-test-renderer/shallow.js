/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import ReactShallowRenderer from 'react-shallow-renderer';
import {enableReactTestRendererWarning} from 'shared/ReactFeatureFlags';

const emptyObject = {};

export default class ReactShallowRendererWithWarning extends ReactShallowRenderer {
  render(element, context = emptyObject) {
    if (__DEV__) {
      if (enableReactTestRendererWarning === true) {
        console.warn(
          "React's Shallow Renderer export will be removed in a future release. " +
            'Please use @testing-library/react instead.',
        );
      }
    }

    return super.render(element, context);
  }
}
