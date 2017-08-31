/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeEventTypes
 * @flow
 */
'use strict';

const Platform = require('Platform');

const emptyObject = require('fbjs/lib/emptyObject');

const COMMON_BUBBLING_EVENT_TYPES = {
  topBlur: {
    phasedRegistrationNames: {
      captured: 'onBlurCapture',
      bubbled: 'onBlur',
    },
  },
  topChange: {
    phasedRegistrationNames: {
      captured: 'onChangeCapture',
      bubbled: 'onChange',
    },
  },
  topEndEditing: {
    phasedRegistrationNames: {
      captured: 'onEndEditingCapture',
      bubbled: 'onEndEditing',
    },
  },
  topFocus: {
    phasedRegistrationNames: {
      captured: 'onFocusCapture',
      bubbled: 'onFocus',
    },
  },
  topSubmitEditing: {
    phasedRegistrationNames: {
      captured: 'onSubmitEditingCapture',
      bubbled: 'onSubmitEditing',
    },
  },
  topTouchEnd: {
    phasedRegistrationNames: {
      captured: 'onTouchEndCapture',
      bubbled: 'onTouchEnd',
    },
  },
  topTouchMove: {
    phasedRegistrationNames: {
      captured: 'onTouchMoveCapture',
      bubbled: 'onTouchMove',
    },
  },
  topTouchStart: {
    phasedRegistrationNames: {
      captured: 'onTouchStartCapture',
      bubbled: 'onTouchStart',
    },
  },
};

const COMMON_DIRECT_EVENT_TYPES = {
  topError: {
    registrationName: 'onError',
  },
  topLayout: {
    registrationName: 'onLayout',
  },
  topLoad: {
    registrationName: 'onLoad',
  },
  topLoadEnd: {
    registrationName: 'onLoadEnd',
  },
  topLoadStart: {
    registrationName: 'onLoadStart',
  },
  topLoadingError: {
    registrationName: 'onLoadingError',
  },
  topLoadingFinish: {
    registrationName: 'onLoadingFinish',
  },
  topLoadingStart: {
    registrationName: 'onLoadingStart',
  },
  topMessage: {
    registrationName: 'onMessage',
  },
  topMomentumScrollBegin: {
    registrationName: 'onMomentumScrollBegin',
  },
  topMomentumScrollEnd: {
    registrationName: 'onMomentumScrollEnd',
  },
  topRefresh: {
    registrationName: 'onRefresh',
  },
  topScroll: {
    registrationName: 'onScroll',
  },
  topScrollAnimationEnd: {
    registrationName: 'onScrollAnimationEnd',
  },
  topScrollBeginDrag: {
    registrationName: 'onScrollBeginDrag',
  },
  topScrollEndDrag: {
    registrationName: 'onScrollEndDrag',
  },
  topSelectionChange: {
    registrationName: 'onSelectionChange',
  },
  topShow: {
    registrationName: 'onShow',
  },
};

const ANDROID_BUBBLING_EVENT_TYPES = {
  ...COMMON_BUBBLING_EVENT_TYPES,
  topSelect: {
    phasedRegistrationNames: {
      bubbled: 'onSelect',
      captured: 'onSelectCapture',
    },
  },
  topTextInput: {
    phasedRegistrationNames: {
      bubbled: 'onTextInput',
      captured: 'onTextInputCapture',
    },
  },
};

const ANDROID_DIRECT_EVENT_TYPES = {
  ...COMMON_DIRECT_EVENT_TYPES,
  topContentSizeChange: {
    registrationName: 'onContentSizeChange',
  },
  topDrawerClosed: {
    registrationName: 'onDrawerClose',
  },
  topDrawerOpened: {
    registrationName: 'onDrawerOpen',
  },
  topDrawerSlide: {
    registrationName: 'onDrawerSlide',
  },
  topDrawerStateChanged: {
    registrationName: 'onDrawerStateChanged',
  },
  topPageScroll: {
    registrationName: 'onPageScroll',
  },
  topPageScrollStateChanged: {
    registrationName: 'onPageScrollStateChanged',
  },
  topPageSelected: {
    registrationName: 'onPageSelected',
  },
  topRequestClose: {
    registrationName: 'onRequestClose',
  },
  topSlidingComplete: {
    registrationName: 'onSlidingComplete',
  },
  topVideoProgress: {
    registrationName: 'onProgress',
  },
  topVideoSizeDetected: {
    registrationName: 'onVideoSizeDetected',
  },
  topVideoStateChange: {
    registrationName: 'onStateChange',
  },
  topZoom: {
    registrationName: 'onZoom',
  },
};

const IOS_BUBBLING_EVENT_TYPES = {
  ...COMMON_BUBBLING_EVENT_TYPES,
  topAnnotationBlur: {
    phasedRegistrationNames: {
      captured: 'onAnnotationBlurCapture',
      bubbled: 'onAnnotationBlur',
    },
  },
  topAnnotationDragStateChange: {
    phasedRegistrationNames: {
      captured: 'onAnnotationDragStateChangeCapture',
      bubbled: 'onAnnotationDragStateChange',
    },
  },
  topAnnotationFocus: {
    phasedRegistrationNames: {
      captured: 'onAnnotationFocusCapture',
      bubbled: 'onAnnotationFocus',
    },
  },
  topContentSizeChange: {
    phasedRegistrationNames: {
      captured: 'onContentSizeChangeCapture',
      bubbled: 'onContentSizeChange',
    },
  },
  topKeyPress: {
    phasedRegistrationNames: {
      captured: 'onKeyPressCapture',
      bubbled: 'onKeyPress',
    },
  },
  topLeftButtonPress: {
    phasedRegistrationNames: {
      captured: 'onLeftButtonPressCapture',
      bubbled: 'onLeftButtonPress',
    },
  },
  topNavigationComplete: {
    phasedRegistrationNames: {
      captured: 'onNavigationCompleteCapture',
      bubbled: 'onNavigationComplete',
    },
  },
  topPress: {
    phasedRegistrationNames: {
      captured: 'onPressCapture',
      bubbled: 'onPress',
    },
  },
  topRightButtonPress: {
    phasedRegistrationNames: {
      captured: 'onRightButtonPressCapture',
      bubbled: 'onRightButtonPress',
    },
  },
  topSlidingComplete: {
    phasedRegistrationNames: {
      captured: 'onSlidingCompleteCapture',
      bubbled: 'onSlidingComplete',
    },
  },
  topTouchCancel: {
    phasedRegistrationNames: {
      captured: 'onTouchCancelCapture',
      bubbled: 'onTouchCancel',
    },
  },
  topValueChange: {
    phasedRegistrationNames: {
      captured: 'onValueChangeCapture',
      bubbled: 'onValueChange',
    },
  },
};

const IOS_DIRECT_EVENT_TYPES = {
  ...COMMON_DIRECT_EVENT_TYPES,
  topAccessibilityTap: {
    registrationName: 'onAccessibilityTap',
  },
  topMagicTap: {
    registrationName: 'onMagicTap',
  },
  topNavigationProgress: {
    registrationName: 'onNavigationProgress',
  },
  topOrientationChange: {
    registrationName: 'onOrientationChange',
  },
  topPartialLoad: {
    registrationName: 'onPartialLoad',
  },
  topProgress: {
    registrationName: 'onProgress',
  },
  topShouldStartLoadWithRequest: {
    registrationName: 'onShouldStartLoadWithRequest',
  },
  topStateChange: {
    registrationName: 'onStateChange',
  },
  topTextInput: {
    registrationName: 'onTextInput',
  },
  topTextLayout: {
    registrationName: 'onTextLayout',
  },
};

let ReactNativeEventTypes;
if (Platform.OS === 'ios') {
  ReactNativeEventTypes = {
    customBubblingEventTypes: IOS_BUBBLING_EVENT_TYPES,
    customDirectEventTypes: IOS_DIRECT_EVENT_TYPES,
  };
} else if (Platform.OS === 'android') {
  ReactNativeEventTypes = {
    customBubblingEventTypes: ANDROID_BUBBLING_EVENT_TYPES,
    customDirectEventTypes: ANDROID_DIRECT_EVENT_TYPES,
  };
} else {
  ReactNativeEventTypes = {
    customBubblingEventTypes: emptyObject,
    customDirectEventTypes: emptyObject,
  };
}

module.exports = ReactNativeEventTypes;
