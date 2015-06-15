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
 * @emails javascript@lists.facebook.com voloko@fb.com
 */
describe("getImageSize", function() {
  var path = require('path');
  var fs = require('fs');
  var root = path.join(__dirname, '..', '__test_data__', 'Image');
  var getImageSize = require('../lib/parse/getImageSize');

  it('should parse gif image size', function() {
    var buffer = fs.readFileSync(path.join(root, '200x100.gif'));
    var size = getImageSize(buffer);
    expect(size.width).toBe(200);
    expect(size.height).toBe(100);
  });

  it('should parse png image size', function() {
    var buffer = fs.readFileSync(path.join(root, '200x100.png'));
    var size = getImageSize(buffer);
    expect(size.width).toBe(200);
    expect(size.height).toBe(100);
  });

  it('should parse jpeg image size', function() {
    var buffer = fs.readFileSync(path.join(root, '200x100.jpg'));
    var size = getImageSize(buffer);
    expect(size.width).toBe(200);
    expect(size.height).toBe(100);
  });
});
