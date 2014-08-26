/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @emails jeffmo@fb.com
 */
"use strict";

require('mock-modules').autoMockOff();

var transformAll = require('../../syntax.js').transformAll;

function transform(source) {
  return transformAll(source, {}, ['allocate']);
}

describe('react displayName jsx', function() {

  it('should only inject displayName if missing', function() {
    var code = [
      '"use strict";',
      'var Whateva = React.createClass({',
      '  displayName: \'Whateva\',',
      '  render: function() {',
      '    return null;',
      '  }',
      '});'
    ].join('\n');

    var result = [
      '"use strict";',
      'var Whateva = React.createClass({',
      '  displayName: \'Whateva\',',
      '  render: function() {',
      '    return null;',
      '  }',
      '});'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should inject displayName in simple assignment', () => {
    var code = [
      'var Component = React.createClass({',
      '  render: function() {',
      '    return null;',
      '  }',
      '});'
    ].join('\n');

    var result = [
      'var Component = React.createClass({displayName: \'Component\',',
      '  render: function() {',
      '    return null;',
      '  }',
      '});'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should inject displayName in simple assignment without var', () => {
    var code = [
      'var Component;',
      'Component = React.createClass({',
      '  render: function() {',
      '    return null;',
      '  }',
      '});'
    ].join('\n');

    var result = [
      'var Component;',
      'Component = React.createClass({displayName: \'Component\',',
      '  render: function() {',
      '    return null;',
      '  }',
      '});'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should inject displayName in property assignment', () => {
    var code = [
      'exports.Component = React.createClass({',
      '  render: function() {',
      '    return null;',
      '  }',
      '});'
    ].join('\n');

    var result = [
      'exports.Component = React.createClass({displayName: \'Component\',',
      '  render: function() {',
      '    return null;',
      '  }',
      '});'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

  it('should inject displayName in object declaration', () => {
    var code = [
      'exports = {',
      '  Component: React.createClass({',
      '    render: function() {',
      '      return null;',
      '    }',
      '  })',
      '};'
    ].join('\n');

    var result = [
      'exports = {',
      '  Component: React.createClass({displayName: \'Component\',',
      '    render: function() {',
      '      return null;',
      '    }',
      '  })',
      '};'
    ].join('\n');

    expect(transform(code).code).toEqual(result);
  });

});
