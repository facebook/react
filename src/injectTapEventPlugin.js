module.exports = function injectTapEventPlugin () {
  var React = require("react");
  React.initializeTouchEvents(true);

  require('react/lib/EventPluginHub').injection.injectEventPluginsByName({
    "ResponderEventPlugin": require('react-touch/lib/thirdparty/ResponderEventPlugin'),
    "TapEventPlugin":       require('react-touch/lib/thirdparty/TapEventPlugin')
  });
};