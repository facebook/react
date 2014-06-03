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
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var mocks = require('mocks');

var React;

describe('ReactCompositeComponent-config', function() {

  beforeEach(function() {
    React = require('React');
  });

  it('should update configuation when prompted', function(){
    var ToConfigure = React.createClass({
      config: {
        value: 'default'
      },
      render: function(){
        return <div />;
      }
    });

    var Configured = React.configClass(ToConfigure, {value:'custom'});

    expect(ToConfigure.originalSpec.config.value).toBe('default');
    expect(Configured.originalSpec.config.value).toBe('custom');
  });

  it('should throw when a non React class is passed', function(){
    expect(function(){
      React.configClass({}, {});
    }).toThrow('Class must be a React component class');
  });

  it('should throw when a class with no config', function(){
    var NoConfig = React.createClass({
      render: function(){
        return <div />;
      }
    });

    expect(function(){
      React.configClass(NoConfig, {});
    }).toThrow('The provided class must implement config');
  });

  it('should throw when not passed a config object', function(){
    var ToConfigure = React.createClass({
      config: {
        value: 'default'
      },
      render: function(){
        return <div />;
      }
    });

    expect(function(){
      React.configClass(ToConfigure);
    }).toThrow('Config must be an object');
  });
});
