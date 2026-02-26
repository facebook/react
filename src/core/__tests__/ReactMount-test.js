/**
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

describe('ReactMount', function() {
  var React = require('React');
  var ReactMount = require('ReactMount');

  it('should render different components in same root', function() {
    var container = document.createElement('container');
    document.documentElement.appendChild(container);

    ReactMount.renderComponent(<div></div>, container);
    expect(container.firstChild.nodeName).toBe('DIV');

    ReactMount.renderComponent(<span></span>, container);
    expect(container.firstChild.nodeName).toBe('SPAN');
  });
});
