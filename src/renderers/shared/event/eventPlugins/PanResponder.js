/**
 * @providesModule PanResponder
 */

"use strict";

var TouchHistoryMath = require('TouchHistoryMath');

var currentCentroidXOfTouchesChangedAfter =
  TouchHistoryMath.currentCentroidXOfTouchesChangedAfter;
var currentCentroidYOfTouchesChangedAfter =
  TouchHistoryMath.currentCentroidYOfTouchesChangedAfter;
var previousCentroidXOfTouchesChangedAfter =
  TouchHistoryMath.previousCentroidXOfTouchesChangedAfter;
var previousCentroidYOfTouchesChangedAfter =
  TouchHistoryMath.previousCentroidYOfTouchesChangedAfter;
var currentCentroidX = TouchHistoryMath.currentCentroidX;
var currentCentroidY = TouchHistoryMath.currentCentroidY;

/**
 * `PanResponder` reconciles several touches into a single gesture. It makes
 * single-touch gestures resilient to extra touches, and can be used to
 * recognize simple multi-touch gestures.
 *
 * It provides a predictable wrapper of the responder handlers provided by the
 * [gesture responder system](/react-native/docs/gesture-responder-system.html).
 * For each handler, it provides a new `gestureState` object alongside the
 * normal event.
 *
 * A `gestureState` object has the following:
 *
 *  - `stateID` - ID of the gestureState- persisted as long as there at least
 *     one touch on screen
 *  - `moveX` - the latest screen coordinates of the recently-moved touch
 *  - `moveY` - the latest screen coordinates of the recently-moved touch
 *  - `x0` - the screen coordinates of the responder grant
 *  - `y0` - the screen coordinates of the responder grant
 *  - `dx` - accumulated distance of the gesture since the touch started
 *  - `dy` - accumulated distance of the gesture since the touch started
 *  - `vx` - current velocity of the gesture
 *  - `vy` - current velocity of the gesture
 *  - `numberActiveTouches` - Number of touches currently on screeen
 *
 * ### Basic Usage
 *
 * ```
 *   componentWillMount: function() {
 *     this._panGesture = PanResponder.create({
 *       // Ask to be the responder:
 *       onStartShouldSetPanResponder: (evt, gestureState) => true,
 *       onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
 *       onMoveShouldSetPanResponder: (evt, gestureState) => true,
 *       onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
 *
 *       onPanResponderGrant: (evt, gestureState) => {
 *         // The guesture has started. Show visual feedback so the user knows
 *         // what is happening!
 *
 *         // gestureState.{x,y}0 will be set to zero now
 *       },
 *       onPanResponderMove: (evt, gestureState) => {
 *         // The most recent move distance is gestureState.move{X,Y}
 *
 *         // The accumulated gesture distance since becoming responder is
 *         // gestureState.d{x,y}
 *       },
 *       onPanResponderTerminationRequest: (evt, gestureState) => true,
 *       onPanResponderRelease: (evt, gestureState) => {
 *         // The user has released all touches while this view is the
 *         // responder. This typically means a gesture has succeeded
 *       },
 *       onPanResponderTerminate: (evt, gestureState) => {
 *         // Another component has become the responder, so this gesture
 *         // should be cancelled
 *       },
 *       onShouldBlockNativeResponder: (evt, gestureState) => {
 *         // Returns whether this component should block native components from becoming the JS
 *         // responder. Returns true by default. Is currently only supported on android.
 *         return true;
 *       },
 *     });
 *   },
 *
 *   render: function() {
 *     return (
 *       <View {...this._panResponder.panHandlers} />
 *     );
 *   },
 *
 * ```
 *
 * ### Working Example
 *
 * To see it in action, try the
 * [PanResponder example in UIExplorer](https://github.com/facebook/react-native/blob/master/Examples/UIExplorer/ResponderExample.js)
 */

var PanResponder = {

  /**
   *
   * A graphical explanation of the touch data flow:
   *
   * +----------------------------+             +--------------------------------+
   * | ResponderTouchHistoryStore |             |TouchHistoryMath                |
   * +----------------------------+             +----------+---------------------+
   * |Global store of touchHistory|             |Allocation-less math util       |
   * |including activeness, start |             |on touch history (centroids     |
   * |position, prev/cur position.|             |and multitouch movement etc)    |
   * |                            |             |                                |
   * +----^-----------------------+             +----^---------------------------+
   *      |                                          |
   *      | (records relevant history                |
   *      |  of touches relevant for                 |
   *      |  implementing higher level               |
   *      |  gestures)                               |
   *      |                                          |
   * +----+-----------------------+             +----|---------------------------+
   * | ResponderEventPlugin       |             |    |   Your App/Component      |
   * +----------------------------+             +----|---------------------------+
   * |Negotiates which view gets  | Low level   |    |             High level    |
   * |onResponderMove events.     | events w/   |  +-+-------+     events w/     |
   * |Also records history into   | touchHistory|  |   Pan   |     multitouch +  |
   * |ResponderTouchHistoryStore. +---------------->Responder+-----> accumulative|
   * +----------------------------+ attached to |  |         |     distance and  |
   *                                 each event |  +---------+     velocity.     |
   *                                            |                                |
   *                                            |                                |
   *                                            +--------------------------------+
   *
   *
   *
   * Gesture that calculates cumulative movement over time in a way that just
   * "does the right thing" for multiple touches. The "right thing" is very
   * nuanced. When moving two touches in opposite directions, the cumulative
   * distance is zero in each dimension. When two touches move in parallel five
   * pixels in the same direction, the cumulative distance is five, not ten. If
   * two touches start, one moves five in a direction, then stops and the other
   * touch moves fives in the same direction, the cumulative distance is ten.
   *
   * This logic requires a kind of processing of time "clusters" of touch events
   * so that two touch moves that essentially occur in parallel but move every
   * other frame respectively, are considered part of the same movement.
   *
   * Explanation of some of the non-obvious fields:
   *
   * - moveX/moveY: If no move event has been observed, then `(moveX, moveY)` is
   *   invalid. If a move event has been observed, `(moveX, moveY)` is the
   *   centroid of the most recently moved "cluster" of active touches.
   *   (Currently all move have the same timeStamp, but later we should add some
   *   threshold for what is considered to be "moving"). If a palm is
   *   accidentally counted as a touch, but a finger is moving greatly, the palm
   *   will move slightly, but we only want to count the single moving touch.
   * - x0/y0: Centroid location (non-cumulative) at the time of becoming
   *   responder.
   * - dx/dy: Cumulative touch distance - not the same thing as sum of each touch
   *   distance. Accounts for touch moves that are clustered together in time,
   *   moving the same direction. Only valid when currently responder (otherwise,
   *   it only represents the drag distance below the threshold).
   * - vx/vy: Velocity.
   */

  _initializeGestureState: function(gestureState) {
    gestureState.moveX = 0;
    gestureState.moveY = 0;
    gestureState.x0 = 0;
    gestureState.y0 = 0;
    gestureState.dx = 0;
    gestureState.dy = 0;
    gestureState.vx = 0;
    gestureState.vy = 0;
    gestureState.numberActiveTouches = 0;
    // All `gestureState` accounts for timeStamps up until:
    gestureState._accountsForMovesUpTo = 0;
  },

  /**
   * This is nuanced and is necessary. It is incorrect to continuously take all
   * active *and* recently moved touches, find the centroid, and track how that
   * result changes over time. Instead, we must take all recently moved
   * touches, and calculate how the centroid has changed just for those
   * recently moved touches, and append that change to an accumulator. This is
   * to (at least) handle the case where the user is moving three fingers, and
   * then one of the fingers stops but the other two continue.
   *
   * This is very different than taking all of the recently moved touches and
   * storing their centroid as `dx/dy`. For correctness, we must *accumulate
   * changes* in the centroid of recently moved touches.
   *
   * There is also some nuance with how we handle multiple moved touches in a
   * single event. With the way `ReactNativeEventEmitter` dispatches touches as
   * individual events, multiple touches generate two 'move' events, each of
   * them triggering `onResponderMove`. But with the way `PanResponder` works,
   * all of the gesture inference is performed on the first dispatch, since it
   * looks at all of the touches (even the ones for which there hasn't been a
   * native dispatch yet). Therefore, `PanResponder` does not call
   * `onResponderMove` passed the first dispatch. This diverges from the
   * typical responder callback pattern (without using `PanResponder`), but
   * avoids more dispatches than necessary.
   */
  _updateGestureStateOnMove: function(gestureState, touchHistory) {
    gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
    gestureState.moveX = currentCentroidXOfTouchesChangedAfter(
      touchHistory,
      gestureState._accountsForMovesUpTo
    );
    gestureState.moveY = currentCentroidYOfTouchesChangedAfter(
      touchHistory,
      gestureState._accountsForMovesUpTo
    );
    var movedAfter = gestureState._accountsForMovesUpTo;
    var prevX = previousCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
    var x = currentCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
    var prevY = previousCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
    var y = currentCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
    var nextDX = gestureState.dx + (x - prevX);
    var nextDY = gestureState.dy + (y - prevY);

    // TODO: This must be filtered intelligently.
    var dt =
      (touchHistory.mostRecentTimeStamp - gestureState._accountsForMovesUpTo);
    gestureState.vx = (nextDX - gestureState.dx) / dt;
    gestureState.vy = (nextDY - gestureState.dy) / dt;

    gestureState.dx = nextDX;
    gestureState.dy = nextDY;
    gestureState._accountsForMovesUpTo = touchHistory.mostRecentTimeStamp;
  },

  /**
   * @param {object} config Enhanced versions of all of the responder callbacks
   * that provide not only the typical `ResponderSyntheticEvent`, but also the
   * `PanResponder` gesture state.  Simply replace the word `Responder` with
   * `PanResponder` in each of the typical `onResponder*` callbacks. For
   * example, the `config` object would look like:
   *
   *  - `onMoveShouldSetPanResponder: (e, gestureState) => {...}`
   *  - `onMoveShouldSetPanResponderCapture: (e, gestureState) => {...}`
   *  - `onStartShouldSetPanResponder: (e, gestureState) => {...}`
   *  - `onStartShouldSetPanResponderCapture: (e, gestureState) => {...}`
   *  - `onPanResponderReject: (e, gestureState) => {...}`
   *  - `onPanResponderGrant: (e, gestureState) => {...}`
   *  - `onPanResponderStart: (e, gestureState) => {...}`
   *  - `onPanResponderEnd: (e, gestureState) => {...}`
   *  - `onPanResponderRelease: (e, gestureState) => {...}`
   *  - `onPanResponderMove: (e, gestureState) => {...}`
   *  - `onPanResponderTerminate: (e, gestureState) => {...}`
   *  - `onPanResponderTerminationRequest: (e, gestureState) => {...}`
   *  - 'onShouldBlockNativeResponder: (e, gestureState) => {...}'
   *
   *  In general, for events that have capture equivalents, we update the
   *  gestureState once in the capture phase and can use it in the bubble phase
   *  as well.
   *
   *  Be careful with onStartShould* callbacks. They only reflect updated
   *  `gestureState` for start/end events that bubble/capture to the Node.
   *  Once the node is the responder, you can rely on every start/end event
   *  being processed by the gesture and `gestureState` being updated
   *  accordingly. (numberActiveTouches) may not be totally accurate unless you
   *  are the responder.
   */
  create: function(config) {
    var gestureState = {
      // Useful for debugging
      stateID: Math.random(),
    };
    PanResponder._initializeGestureState(gestureState);
    var panHandlers = {
      onStartShouldSetResponder: function(e) {
        return config.onStartShouldSetPanResponder === undefined ? false :
          config.onStartShouldSetPanResponder(e, gestureState);
      },
      onMoveShouldSetResponder: function(e) {
        return config.onMoveShouldSetPanResponder === undefined ? false :
          config.onMoveShouldSetPanResponder(e, gestureState);
      },
      onStartShouldSetResponderCapture: function(e) {
        // TODO: Actually, we should reinitialize the state any time
        // touches.length increases from 0 active to > 0 active.
        if (e.nativeEvent.touches.length === 1) {
          PanResponder._initializeGestureState(gestureState);
        }
        gestureState.numberActiveTouches = e.touchHistory.numberActiveTouches;
        return config.onStartShouldSetPanResponderCapture !== undefined ?
          config.onStartShouldSetPanResponderCapture(e, gestureState) : false;
      },

      onMoveShouldSetResponderCapture: function(e) {
        var touchHistory = e.touchHistory;
        // Responder system incorrectly dispatches should* to current responder
        // Filter out any touch moves past the first one - we would have
        // already processed multi-touch geometry during the first event.
        if (gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp) {
          return false;
        }
        PanResponder._updateGestureStateOnMove(gestureState, touchHistory);
        return config.onMoveShouldSetResponderCapture ?
          config.onMoveShouldSetPanResponderCapture(e, gestureState) : false;
      },

      onResponderGrant: function(e) {
        gestureState.x0 = currentCentroidX(e.touchHistory);
        gestureState.y0 = currentCentroidY(e.touchHistory);
        gestureState.dx = 0;
        gestureState.dy = 0;
        config.onPanResponderGrant && config.onPanResponderGrant(e, gestureState);
        // TODO: t7467124 investigate if this can be removed
        return config.onShouldBlockNativeResponder === undefined ? true :
          config.onShouldBlockNativeResponder();
      },

      onResponderReject: function(e) {
        config.onPanResponderReject && config.onPanResponderReject(e, gestureState);
      },

      onResponderRelease: function(e) {
        config.onPanResponderRelease && config.onPanResponderRelease(e, gestureState);
        PanResponder._initializeGestureState(gestureState);
      },

      onResponderStart: function(e) {
        var touchHistory = e.touchHistory;
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        config.onPanResponderStart && config.onPanResponderStart(e, gestureState);
      },

      onResponderMove: function(e) {
        var touchHistory = e.touchHistory;
        // Guard against the dispatch of two touch moves when there are two
        // simultaneously changed touches.
        if (gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp) {
          return;
        }
        // Filter out any touch moves past the first one - we would have
        // already processed multi-touch geometry during the first event.
        PanResponder._updateGestureStateOnMove(gestureState, touchHistory);
        config.onPanResponderMove && config.onPanResponderMove(e, gestureState);
      },

      onResponderEnd: function(e) {
        var touchHistory = e.touchHistory;
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        config.onPanResponderEnd && config.onPanResponderEnd(e, gestureState);
      },

      onResponderTerminate: function(e) {
        config.onPanResponderTerminate &&
          config.onPanResponderTerminate(e, gestureState);
        PanResponder._initializeGestureState(gestureState);
      },

      onResponderTerminationRequest: function(e) {
        return config.onPanResponderTerminationRequest === undefined ? true :
          config.onPanResponderTerminationRequest(e, gestureState);
      },
    };
    return {panHandlers: panHandlers};
  },
};

module.exports = PanResponder;
