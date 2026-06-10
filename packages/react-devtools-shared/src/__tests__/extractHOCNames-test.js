/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {extractHOCNames} from 'react-devtools-shared/src/backend/views/utils';

describe('extractHOCNames', () => {
  it('should extract nested HOC names in order', () => {
    expect(extractHOCNames('Memo(Forget(Foo))')).toEqual({
      baseComponentName: 'Foo',
      hocNames: ['Memo', 'Forget'],
    });
  });

  it('should handle a single HOC', () => {
    expect(extractHOCNames('Memo(Foo)')).toEqual({
      baseComponentName: 'Foo',
      hocNames: ['Memo'],
    });
  });

  it('should return the original name when there are no HOCs', () => {
    expect(extractHOCNames('Foo')).toEqual({
      baseComponentName: 'Foo',
      hocNames: [],
    });
  });
});
