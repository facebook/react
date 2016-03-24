/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule renderApplication
 * @noflow
 */

'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Subscribable = require('Subscribable');
var View = require('View');

var invariant = require('fbjs/lib/invariant');

var Inspector = __DEV__ ? require('Inspector') : null;
var YellowBox = __DEV__ ? require('YellowBox') : null;

var AppContainer = React.createClass({
  mixins: [Subscribable.Mixin],

  getInitialState: function() {
    return { inspector: null };
  },

  toggleElementInspector: function() {
    var inspector = !__DEV__ || this.state.inspector
      ? null
      : <Inspector
          rootTag={this.props.rootTag}
          inspectedViewTag={React.findNodeHandle(this.refs.main)}
        />;
    this.setState({inspector});
  },

  componentDidMount: function() {
    this.addListenerOn(
      RCTDeviceEventEmitter,
      'toggleElementInspector',
      this.toggleElementInspector
    );
  },

  render: function() {
    let yellowBox = null;
    if (__DEV__) {
      yellowBox = <YellowBox />;
    }
    return (
      <View style={styles.appContainer}>
        <View collapsible={false} style={styles.appContainer} ref="main">
          {this.props.children}
        </View>
        {yellowBox}
        {this.state.inspector}
      </View>
    );
  }
});

function renderApplication<D, P, S>(
  RootComponent: ReactClass<P>,
  initialProps: P,
  rootTag: any
) {
  invariant(
    rootTag,
    'Expect to have a valid rootTag, instead got ', rootTag
  );
  /* eslint-disable jsx-no-undef-with-namespace */
  React.render(
    <AppContainer rootTag={rootTag}>
      <RootComponent
        {...initialProps}
        rootTag={rootTag}
      />
    </AppContainer>,
    rootTag
  );
  /* eslint-enable jsx-no-undef-with-namespace */
}

var styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
});

module.exports = renderApplication;
