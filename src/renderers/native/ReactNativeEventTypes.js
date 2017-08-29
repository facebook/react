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

const ANDROID_BUBBLING_EVENT_TYPES = {
  topTouchMove: {
    phasedRegistrationNames: {
      bubbled: 'onTouchMove',
      captured: 'onTouchMoveCapture',
    },
  },
  topFocus: {
    phasedRegistrationNames: {
      bubbled: 'onFocus',
      captured: 'onFocusCapture',
    },
  },
  topChange: {
    phasedRegistrationNames: {
      bubbled: 'onChange',
      captured: 'onChangeCapture',
    },
  },
  topTextInput: {
    phasedRegistrationNames: {
      bubbled: 'onTextInput',
      captured: 'onTextInputCapture',
    },
  },
  topSelect: {
    phasedRegistrationNames: {
      bubbled: 'onSelect',
      captured: 'onSelectCapture',
    },
  },
  topTouchEnd: {
    phasedRegistrationNames: {
      bubbled: 'onTouchEnd',
      captured: 'onTouchEndCapture',
    },
  },
  topBlur: {
    phasedRegistrationNames: {
      bubbled: 'onBlur',
      captured: 'onBlurCapture',
    },
  },
  topEndEditing: {
    phasedRegistrationNames: {
      bubbled: 'onEndEditing',
      captured: 'onEndEditingCapture',
    },
  },
  topSubmitEditing: {
    phasedRegistrationNames: {
      bubbled: 'onSubmitEditing',
      captured: 'onSubmitEditingCapture',
    },
  },
  topTouchStart: {
    phasedRegistrationNames: {
      bubbled: 'onTouchStart',
      captured: 'onTouchStartCapture',
    },
  },
};

const ANDROID_DIRECT_EVENT_TYPES = {
  topMomentumScrollEnd: {
    registrationName: 'onMomentumScrollEnd',
  },
  topScrollBeginDrag: {
    registrationName: 'onScrollBeginDrag',
  },
  topPageScrollStateChanged: {
    registrationName: 'onPageScrollStateChanged',
  },
  topLayout: {
    registrationName: 'onLayout',
  },
  topVideoStateChange: {
    registrationName: 'onStateChange',
  },
  topRefresh: {
    registrationName: 'onRefresh',
  },
  topError: {
    registrationName: 'onError',
  },
  topLoadStart: {
    registrationName: 'onLoadStart',
  },
  topShow: {
    registrationName: 'onShow',
  },
  topMessage: {
    registrationName: 'onMessage',
  },
  topVideoProgress: {
    registrationName: 'onProgress',
  },
  topScrollAnimationEnd: {
    registrationName: 'onScrollAnimationEnd',
  },
  topPageScroll: {
    registrationName: 'onPageScroll',
  },
  topDrawerSlide: {
    registrationName: 'onDrawerSlide',
  },
  topZoom: {
    registrationName: 'onZoom',
  },
  topLoadEnd: {
    registrationName: 'onLoadEnd',
  },
  topDrawerStateChanged: {
    registrationName: 'onDrawerStateChanged',
  },
  topDrawerOpened: {
    registrationName: 'onDrawerOpen',
  },
  topRequestClose: {
    registrationName: 'onRequestClose',
  },
  topContentSizeChange: {
    registrationName: 'onContentSizeChange',
  },
  topLoadingFinish: {
    registrationName: 'onLoadingFinish',
  },
  topMomentumScrollBegin: {
    registrationName: 'onMomentumScrollBegin',
  },
  topPageSelected: {
    registrationName: 'onPageSelected',
  },
  topSelectionChange: {
    registrationName: 'onSelectionChange',
  },
  topScrollEndDrag: {
    registrationName: 'onScrollEndDrag',
  },
  topVideoSizeDetected: {
    registrationName: 'onVideoSizeDetected',
  },
  topLoad: {
    registrationName: 'onLoad',
  },
  topScroll: {
    registrationName: 'onScroll',
  },
  topSlidingComplete: {
    registrationName: 'onSlidingComplete',
  },
  topLoadingError: {
    registrationName: 'onLoadingError',
  },
  topLoadingStart: {
    registrationName: 'onLoadingStart',
  },
  topDrawerClosed: {
    registrationName: 'onDrawerClose',
  },
};

const IOS_BUBBLING_EVENT_TYPES = {
  topContentSizeChange: {
    phasedRegistrationNames: {
      captured: 'onContentSizeChangeCapture',
      bubbled: 'onContentSizeChange',
    },
  },
  topTouchCancel: {
    phasedRegistrationNames: {
      captured: 'onTouchCancelCapture',
      bubbled: 'onTouchCancel',
    },
  },
  topAnnotationFocus: {
    phasedRegistrationNames: {
      captured: 'onAnnotationFocusCapture',
      bubbled: 'onAnnotationFocus',
    },
  },
  topPress: {
    phasedRegistrationNames: {
      captured: 'onPressCapture',
      bubbled: 'onPress',
    },
  },
  topSlidingComplete: {
    phasedRegistrationNames: {
      captured: 'onSlidingCompleteCapture',
      bubbled: 'onSlidingComplete',
    },
  },
  topEndEditing: {
    phasedRegistrationNames: {
      captured: 'onEndEditingCapture',
      bubbled: 'onEndEditing',
    },
  },
  topChange: {
    phasedRegistrationNames: {
      captured: 'onChangeCapture',
      bubbled: 'onChange',
    },
  },
  topLeftButtonPress: {
    phasedRegistrationNames: {
      captured: 'onLeftButtonPressCapture',
      bubbled: 'onLeftButtonPress',
    },
  },
  topAnnotationBlur: {
    phasedRegistrationNames: {
      captured: 'onAnnotationBlurCapture',
      bubbled: 'onAnnotationBlur',
    },
  },
  topTouchMove: {
    phasedRegistrationNames: {
      captured: 'onTouchMoveCapture',
      bubbled: 'onTouchMove',
    },
  },
  topKeyPress: {
    phasedRegistrationNames: {
      captured: 'onKeyPressCapture',
      bubbled: 'onKeyPress',
    },
  },
  topNavigationComplete: {
    phasedRegistrationNames: {
      captured: 'onNavigationCompleteCapture',
      bubbled: 'onNavigationComplete',
    },
  },
  topSubmitEditing: {
    phasedRegistrationNames: {
      captured: 'onSubmitEditingCapture',
      bubbled: 'onSubmitEditing',
    },
  },
  topTouchStart: {
    phasedRegistrationNames: {
      captured: 'onTouchStartCapture',
      bubbled: 'onTouchStart',
    },
  },
  topValueChange: {
    phasedRegistrationNames: {
      captured: 'onValueChangeCapture',
      bubbled: 'onValueChange',
    },
  },
  topRightButtonPress: {
    phasedRegistrationNames: {
      captured: 'onRightButtonPressCapture',
      bubbled: 'onRightButtonPress',
    },
  },
  topTouchEnd: {
    phasedRegistrationNames: {
      captured: 'onTouchEndCapture',
      bubbled: 'onTouchEnd',
    },
  },
  topAnnotationDragStateChange: {
    phasedRegistrationNames: {
      captured: 'onAnnotationDragStateChangeCapture',
      bubbled: 'onAnnotationDragStateChange',
    },
  },
  topBlur: {
    phasedRegistrationNames: {
      captured: 'onBlurCapture',
      bubbled: 'onBlur',
    },
  },
  topFocus: {
    phasedRegistrationNames: {
      captured: 'onFocusCapture',
      bubbled: 'onFocus',
    },
  },
};

const IOS_DIRECT_EVENT_TYPES = {
  topStateChange: {
    registrationName: 'onStateChange',
  },
  topSelectionChange: {
    registrationName: 'onSelectionChange',
  },
  topProgress: {
    registrationName: 'onProgress',
  },
  topTextInput: {
    registrationName: 'onTextInput',
  },
  topShow: {
    registrationName: 'onShow',
  },
  topMessage: {
    registrationName: 'onMessage',
  },
  topMomentumScrollEnd: {
    registrationName: 'onMomentumScrollEnd',
  },
  topRefresh: {
    registrationName: 'onRefresh',
  },
  topScrollAnimationEnd: {
    registrationName: 'onScrollAnimationEnd',
  },
  topLoad: {
    registrationName: 'onLoad',
  },
  topScroll: {
    registrationName: 'onScroll',
  },
  topNavigationProgress: {
    registrationName: 'onNavigationProgress',
  },
  topMagicTap: {
    registrationName: 'onMagicTap',
  },
  topOrientationChange: {
    registrationName: 'onOrientationChange',
  },
  topLoadingStart: {
    registrationName: 'onLoadingStart',
  },
  topLoadingError: {
    registrationName: 'onLoadingError',
  },
  topPartialLoad: {
    registrationName: 'onPartialLoad',
  },
  topLoadStart: {
    registrationName: 'onLoadStart',
  },
  topError: {
    registrationName: 'onError',
  },
  topTextLayout: {
    registrationName: 'onTextLayout',
  },
  topMomentumScrollBegin: {
    registrationName: 'onMomentumScrollBegin',
  },
  topShouldStartLoadWithRequest: {
    registrationName: 'onShouldStartLoadWithRequest',
  },
  topScrollEndDrag: {
    registrationName: 'onScrollEndDrag',
  },
  topLoadingFinish: {
    registrationName: 'onLoadingFinish',
  },
  topScrollBeginDrag: {
    registrationName: 'onScrollBeginDrag',
  },
  topLoadEnd: {
    registrationName: 'onLoadEnd',
  },
  topLayout: {
    registrationName: 'onLayout',
  },
  topAccessibilityTap: {
    registrationName: 'onAccessibilityTap',
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
