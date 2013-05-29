/**
 * @providesModule ReactDefaultInjection
 */

"use strict";

var ReactDOM = require('ReactDOM');
var ReactDOMForm = require('ReactDOMForm');

var DefaultEventPluginOrder = require('DefaultEventPluginOrder');
var EnterLeaveEventPlugin = require('EnterLeaveEventPlugin');
var EventPluginHub = require('EventPluginHub');
var ReactInstanceHandles = require('ReactInstanceHandles');
var SimpleEventPlugin = require('SimpleEventPlugin');

function inject() {
  /**
   * Inject module for resolving DOM hierarchy and plugin ordering.
   */
  EventPluginHub.injection.injectEventPluginOrder(DefaultEventPluginOrder);
  EventPluginHub.injection.injectInstanceHandle(ReactInstanceHandles);

  /**
   * Two important event plugins included by default (without having to require
   * them).
   */
  EventPluginHub.injection.injectEventPluginsByName({
    'SimpleEventPlugin': SimpleEventPlugin,
    'EnterLeaveEventPlugin': EnterLeaveEventPlugin
  });

  /*
   * This is a bit of a hack. We need to override the <form> element
   * to be a composite component because IE8 does not bubble or capture
   * submit to the top level. In order to make this work with our
   * dependency graph we need to inject it here.
   */
  ReactDOM.injection.injectComponentClasses({
    form: ReactDOMForm
  });
}

module.exports = {
  inject: inject
};
