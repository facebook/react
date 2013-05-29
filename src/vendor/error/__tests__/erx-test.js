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
  .dontMock('erx')
  .dontMock('ex');

describe('erx', function() {
  var erx = require('erx');
  var ex = require('ex');

  it('should always reverse ex if placeholder and argument match', function() {
    expect(erx(ex('zero argument'))).toEqual(['zero argument']);
    expect(erx(ex('one argument: %s', 'one')))
      .toEqual(['one argument: %s', 'one']);
    expect(erx(ex('two arguments: %s, %s', 'one', 2)))
      .toEqual(['two arguments: %s, %s', 'one', '2']);
    expect(erx(ex('three arguments: %s, %s, %s', 'one', 2, { value: 3 })))
      .toEqual(['three arguments: %s, %s, %s', 'one', '2', '[object Object]']);
  });

  it('should be idempotent', function() {
    var messageWithParams = erx(ex('one argument: %s', 'one'));
    expect(messageWithParams).toEqual(erx(messageWithParams));
  });

  it('should treat plain text as it was ex-ed with no argument', function() {
    expect(erx('plain text')).toEqual(['plain text']);
  });

  it('should work when text was appended/prepended to ex-ed text', function() {
    expect(erx('prepended text|' + ex('zero argument') + '|appended text'))
      .toEqual(['prepended text|zero argument|appended text']);
    expect(erx(
      'prepended text|' +
      ex('one argument: %s', 'one') +
      '|appended text'
    )).toEqual(['prepended text|one argument: %s|appended text', 'one']);
  });
});
