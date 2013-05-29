/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @emails catchen@fb.com
 * @emails javascript@lists.facebook.com
 */

require('mock-modules')
  .dontMock('ex');

describe('ex', function() {
  var ex = require('ex');

  it('should convert whatever arguments into one string', function() {
    expect(typeof ex('zero argument')).toEqual('string');
    expect(typeof ex('one argument: %s', 'one')).toEqual('string');
    expect(typeof ex('two arguments: %s, %s', 'one', 2))
      .toEqual('string');
    expect(typeof ex('three arguments: %s, %s, %s', 'one', 2, { value: 3 }))
      .toEqual('string');
  });

  it('should handle placeholder and argument number mismatch', function() {
    expect(typeof ex('zero placeholder and one argument', 'one'))
      .toEqual('string');
    expect(typeof ex('one placeholder and zero argument: %s'))
      .toEqual('string');
  });
});
