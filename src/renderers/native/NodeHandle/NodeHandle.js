/**
 * @providesModule NodeHandle
 */

 /**
  * A "handle" is a serializable representation of the underlying platform's
  * native node abstraction. This allows reasoning about nodes behind a thread
  * (worker) boundary. On some platforms (DOM main thread) the node handle *is*
  * an actual DOM node - `NodeHandle` (and potentially other libraries)
  * abstract away those differences so you can write code that doesn't depend
  * on whether or not you are running in a worker. For example, you could write
  * application code:
  *
  *
  *     SomeLibrary.measureNodeHandle(myNodeHandle, cb)
  *
  *  Where `measureNodeHandle` knows how to handle actual DOM nodes if running
  *  in a worker thread, and knows how to handle numeric IDs if running in a
  *  worker thread.
  *
  *  The only other requirement of a platform/environment is that it always be
  *  possible to extract the React rootNodeID in a blocking manner (see
  *  `getRootNodeID`).
  *
  * +------------------+ +------------------+ +------------------+
  * |                  | |                  | |                  |
  * |     ReactJS      | |  YourUtilities   | |  Animation Utils |
  * |                  | |                  | |                  |
  * +------------------+ +------------------+ +------------------+
  *
  * +------------------------------------------------------------+
  * |         Async Platform Independent Node Interface          |
  * +------------------------------------------------------------+
  * |                                                            |
  * | NodeIterface:                                              |
  * | -measure(nodeHandle, cb)                                   |
  * | -setProperties(nodeHandle, cb)                             |
  * | -manageChildren(nodeHandle, nodeHandles, cb)               |
  * |    ...                                                     |
  * |                                                            |
  * | Note: This may be a simplification. We could break up much |
  * | of this functionality into several smaller libraries, each |
  * | one requiring a .                                          |
  * +------------------------------------------------------------+
  *
  * +------------------------------------------------------------+
  * |                  Platform Implementations                  |
  * |        -----------------------------------------           |
  * |  React Canvas     |  React DOM Worker  |   React DOM main  |
  * +------------------------------------------------------------+
  * |                   |                    |                   |
  * |-measure(..)       |-measure(..)        |-measure(..)       |
  * |-setProperties(..) |-setProperties(..)  |-setProperties(..) |
  * |-manageChildren(..)|-manageChildren(..) |-manageChildren(..)|
  * |       ...         |       ...          |       ...         |
  * +-----------------------------o------------------------------+
  *                               | Worker simply       ^
  *                               |  marshals commands  |
  *                               |  to Web DOM thread. |
  *                               +---------------------+
  */
var NodeHandle = {
  /**
   * Injection
   */
  injection: {
    injectImplementation: function(Impl) {
      NodeHandle._Implementation = Impl;
    }
  },

  _Implementation: null,

  /**
   * @param {NodeHandle} nodeHandle The handle to the low level resource.
   * @return {string} React root node ID.
   */
  getRootNodeID: function(nodeHandle) {
    return NodeHandle._Implementation.getRootNodeID(nodeHandle);
  }
};

module.exports = NodeHandle;
