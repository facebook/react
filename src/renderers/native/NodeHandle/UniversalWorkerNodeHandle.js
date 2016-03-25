/**
 * @providesModule UniversalWorkerNodeHandle
 */

var ReactNativeTagHandles = require('ReactNativeTagHandles');

var invariant = require('invariant');

var UniversalWorkerNodeHandle = {
  getRootNodeID: function(nodeHandle) {
    invariant(
      nodeHandle !== undefined && nodeHandle !== null && nodeHandle !== 0,
      'No node handle defined'
    );
    return ReactNativeTagHandles.tagToRootNodeID[nodeHandle];
  }
};

module.exports = UniversalWorkerNodeHandle;
