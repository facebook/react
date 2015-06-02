/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React = require('ReactWithAddons');

describe('ReactDataTrack', function() {

  it('should update component when a write fires', function () {

    class Person {
      constructor(name) {
        this.setName(name);
      }

      setName(name) {
        this.name = name;
        React.addons.observeWrite(this);
      }

      getName() {
        React.addons.observeRead(this);
        return this.name;
      }
    }

    class PersonView extends React.Component {
      render() {
        return <div>{this.props.person.getName()}</div>;
      }
    }

    var container = document.createElement('div');

    var person = new Person("jimfb");
    React.render(<PersonView person={person} />, container);
    expect(container.children[0].innerHTML).toBe('jimfb');
    person.setName("Jim");
    expect(container.children[0].innerHTML).toBe('Jim');
    React.unmountComponentAtNode(container);
  });
});
