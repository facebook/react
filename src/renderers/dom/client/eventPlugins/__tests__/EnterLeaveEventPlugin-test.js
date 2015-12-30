/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';
var ReactTestUtils = require('ReactTestUtils');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var EventConstants = require('EventConstants');
var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactDOMComponentTree = require('ReactDOMComponentTree');

var topLevelTypes = EventConstants.topLevelTypes;

function createIframe() {
  var iframe = document.createElement('iframe');
  document.body.appendChild(iframe);

  EnterLeaveEventPlugin.isEnterLeaveSupported = false;

  var iframeDocument = iframe.contentDocument;

  iframeDocument.write(
    '<!DOCTYPE html><html><head></head><body><div></div></body></html>'
  );
  iframeDocument.close();

  return iframe;
}

describe('EnterLeaveEventPlugin', function() {

  it('should use native mouseenter is supported', function() {
    if (!EnterLeaveEventPlugin.isEnterLeaveSupported) {
      return;
    }

    var called = 0;

    function onEnter(e) {
      called += 1;
      expect(e.type).toBe('mouseenter');
      expect(e.relatedTarget).toBe(root);
    }

    var inst = ReactTestUtils.renderIntoDocument(
      <div>
        <div onMouseEnter={onEnter} style={{ padding: 30 }}>
          foo
        </div>
      </div>
    );

    var root = ReactDOM.findDOMNode(inst);
    var inner = root.firstChild;

    ReactTestUtils.SimulateNative.mouseEnter(inner, { relatedTarget: root });
    expect(called).toBe(1);
  });

  it('should use native mouseleave is supported', function() {
    if (!EnterLeaveEventPlugin.isEnterLeaveSupported) {
      return;
    }

    var called = 0;

    function onLeave(e) {
      called += 1;
      expect(e.type).toBe('mouseleave');
      expect(e.relatedTarget).toBe(root);
    }

    var inst = ReactTestUtils.renderIntoDocument(
      <div>
        <div onMouseLeave={onLeave} style={{ padding: 30 }}>
          foo
        </div>
      </div>
    );

    var root = ReactDOM.findDOMNode(inst);
    var inner = root.firstChild;

    ReactTestUtils.SimulateNative.mouseLeave(inner, { relatedTarget: root });
    expect(called).toBe(1);
  });

  describe('EnterLeave Polyfill', function() {

    beforeEach(function() {
      EnterLeaveEventPlugin.isEnterLeaveSupported = false;
    });

    it('should use the relatedTarget from mouseover', function() {
      var called = 0;

      function onEnter(e) {
        called += 1;
        expect(e.type).toBe('mouseenter');
        expect(e.relatedTarget).toBe(root);
      }

      var inst = ReactTestUtils.renderIntoDocument(
        <div>
          <div onMouseEnter={onEnter} style={{ padding: 30 }}>
            foo
          </div>
        </div>
      );

      var root = ReactDOM.findDOMNode(inst);
      var inner = root.firstChild;

      ReactTestUtils.SimulateNative.mouseOver(inner, { relatedTarget: root });
      expect(called).toBe(1);
    });

    it('should use the relatedTarget from mouseout', function() {
      var called = 0;

      function onLeave(e) {
        called += 1;
        expect(e.type).toBe('mouseleave');
        expect(e.relatedTarget).toBe(root);
      }

      var inst = ReactTestUtils.renderIntoDocument(
        <div>
          <div onMouseLeave={onLeave} style={{ padding: 30 }}>
            foo
          </div>
        </div>
      );

      var root = ReactDOM.findDOMNode(inst);
      var inner = root.firstChild;

      ReactTestUtils.SimulateNative.mouseOut(inner, { relatedTarget: root });
      expect(called).toBe(1);
    });
  });

  it('should set relatedTarget to the iframe window', function() {
    var noop = function() {};
    var iframe = createIframe();
    var iframeDocument = iframe.contentDocument;

    var div = ReactDOM.render(
      <div onMouseEnter={noop} onMouseLeave={noop}/>,
      iframeDocument.body.getElementsByTagName('div')[0]
    );

    var inst = ReactDOMComponentTree.getInstanceFromNode(div);

    var enter = EnterLeaveEventPlugin.extractEvents(
      topLevelTypes.topMouseOver,
      inst,
      { target: div },
      div
    );

    expect(enter.target).toBe(div);
    expect(enter.relatedTarget).toBe(iframe.contentWindow);
  });
});
