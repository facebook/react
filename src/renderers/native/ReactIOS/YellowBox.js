/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule YellowBox
 * @flow
 */

'use strict';

const EventEmitter = require('EventEmitter');
import type EmitterSubscription from 'EmitterSubscription';
const Platform = require('Platform');
const React = require('React');
const StyleSheet = require('StyleSheet');

const _warningEmitter = new EventEmitter();
const _warningMap = new Map();

/**
 * YellowBox renders warnings at the bottom of the app being developed.
 *
 * Warnings help guard against subtle yet significant issues that can impact the
 * quality of the app. This "in your face" style of warning allows developers to
 * notice and correct these issues as quickly as possible.
 *
 * By default, the warning box is enabled in `__DEV__`. Set the following flag
 * to disable it (and call `console.warn` to update any rendered <YellowBox>):
 *
 *   console.disableYellowBox = true;
 *   console.warn('YellowBox is disabled.');
 *
 * Warnings can be ignored programmatically by setting the array:
 *
 *   console.ignoredYellowBox = ['Warning: ...'];
 *
 * Strings in `console.ignoredYellowBox` can be a prefix of the warning that
 * should be ignored.
 */

if (__DEV__) {
  const {error, warn} = console;
  console.error = function() {
    error.apply(console, arguments);
    // Show yellow box for the `warning` module.
    if (typeof arguments[0] === 'string' &&
        arguments[0].startsWith('Warning: ')) {
      updateWarningMap.apply(null, arguments);
    }
  };
  console.warn = function() {
    warn.apply(console, arguments);
    updateWarningMap.apply(null, arguments);
  };
}

/**
 * Simple function for formatting strings.
 *
 * Replaces placeholders with values passed as extra arguments
 *
 * @param {string} format the base string
 * @param ...args the values to insert
 * @return {string} the replaced string
 */
function sprintf(format, ...args) {
  var index = 0;
  return format.replace(/%s/g, match => args[index++]);
}

function updateWarningMap(format, ...args): void {
  const stringifySafe = require('stringifySafe');

  format = String(format);
  const argCount = (format.match(/%s/g) || []).length;
  const warning = [
    sprintf(format, ...args.slice(0, argCount)),
    ...args.slice(argCount).map(stringifySafe),
  ].join(' ');

  const count = _warningMap.has(warning) ? _warningMap.get(warning) : 0;
  _warningMap.set(warning, count + 1);
  _warningEmitter.emit('warning', _warningMap);
}

function isWarningIgnored(warning: string): boolean {
  return (
    Array.isArray(console.ignoredYellowBox) &&
    console.ignoredYellowBox.some(
      ignorePrefix => warning.startsWith(ignorePrefix)
    )
  );
}

const WarningRow = ({count, warning, onPress}) => {
  const Text = require('Text');
  const TouchableHighlight = require('TouchableHighlight');
  const View = require('View');

  const countText = count > 1 ?
    <Text style={styles.listRowCount}>{'(' + count + ') '}</Text> :
    null;

  return (
    <View style={styles.listRow}>
      <TouchableHighlight
        activeOpacity={0.5}
        onPress={onPress}
        style={styles.listRowContent}
        underlayColor="transparent">
        <Text style={styles.listRowText} numberOfLines={2}>
          {countText}
          {warning}
        </Text>
      </TouchableHighlight>
    </View>
  );
};

const WarningInspector = ({
  count,
  warning,
  onClose,
  onDismiss,
  onDismissAll,
}) => {
  const ScrollView = require('ScrollView');
  const Text = require('Text');
  const TouchableHighlight = require('TouchableHighlight');
  const View = require('View');

  const countSentence =
    'Warning encountered ' + count + ' time' + (count - 1 ? 's' : '') + '.';

  return (
    <TouchableHighlight
      activeOpacity={0.95}
      underlayColor={backgroundColor(0.8)}
      onPress={onClose}
      style={styles.inspector}>
      <View style={styles.inspectorContent}>
        <View style={styles.inspectorCount}>
          <Text style={styles.inspectorCountText}>{countSentence}</Text>
        </View>
        <ScrollView style={styles.inspectorWarning}>
          <Text style={styles.inspectorWarningText}>{warning}</Text>
        </ScrollView>
        <View style={styles.inspectorButtons}>
          <TouchableHighlight
            activeOpacity={0.5}
            onPress={onDismiss}
            style={styles.inspectorButton}
            underlayColor="transparent">
            <Text style={styles.inspectorButtonText}>
              Dismiss
            </Text>
          </TouchableHighlight>
          <TouchableHighlight
            activeOpacity={0.5}
            onPress={onDismissAll}
            style={styles.inspectorButton}
            underlayColor="transparent">
            <Text style={styles.inspectorButtonText}>
              Dismiss All
            </Text>
          </TouchableHighlight>
        </View>
      </View>
    </TouchableHighlight>
  );
};

class YellowBox extends React.Component {
  state: {
    inspecting: ?string;
    warningMap: Map;
  };
  _listener: ?EmitterSubscription;

  constructor(props: mixed, context: mixed) {
    super(props, context);
    this.state = {
      inspecting: null,
      warningMap: _warningMap,
    };
    this.dismissWarning = warning => {
      const {inspecting, warningMap} = this.state;
      if (warning) {
        warningMap.delete(warning);
      } else {
        warningMap.clear();
      }
      this.setState({
        inspecting: (warning && inspecting !== warning) ? inspecting : null,
        warningMap,
      });
    };
  }

  componentDidMount() {
    let scheduled = null;
    this._listener = _warningEmitter.addListener('warning', warningMap => {
      // Use `setImmediate` because warnings often happen during render, but
      // state cannot be set while rendering.
      scheduled = scheduled || setImmediate(() => {
        scheduled = null;
        this.setState({
          warningMap,
        });
      });
    });
  }

  componentWillUnmount() {
    if (this._listener) {
      this._listener.remove();
    }
  }

  render() {
    if (console.disableYellowBox || this.state.warningMap.size === 0) {
      return null;
    }
    const ScrollView = require('ScrollView');
    const View = require('View');

    const inspecting = this.state.inspecting;
    const inspector = inspecting !== null ?
      <WarningInspector
        count={this.state.warningMap.get(inspecting)}
        warning={inspecting}
        onClose={() => this.setState({inspecting: null})}
        onDismiss={() => this.dismissWarning(inspecting)}
        onDismissAll={() => this.dismissWarning(null)}
      /> :
      null;

    const rows = [];
    this.state.warningMap.forEach((count, warning) => {
      if (!isWarningIgnored(warning)) {
        rows.push(
          <WarningRow
            key={warning}
            count={count}
            warning={warning}
            onPress={() => this.setState({inspecting: warning})}
            onDismiss={() => this.dismissWarning(warning)}
          />
        );
      }
    });

    const listStyle = [
      styles.list,
      // Additional `0.4` so the 5th row can peek into view.
      {height: Math.min(rows.length, 4.4) * (rowGutter + rowHeight)},
    ];
    return (
      <View style={inspector ? styles.fullScreen : listStyle}>
        <ScrollView style={listStyle} scrollsToTop={false}>
          {rows}
        </ScrollView>
        {inspector}
      </View>
    );
  }
}

const backgroundColor = opacity => 'rgba(250, 186, 48, ' + opacity + ')';
const textColor = 'white';
const rowGutter = 1;
const rowHeight = 46;

var styles = StyleSheet.create({
  fullScreen: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  inspector: {
    backgroundColor: backgroundColor(0.95),
    flex: 1,
  },
  inspectorContainer: {
    flex: 1,
  },
  inspectorButtons: {
    flexDirection: 'row',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  inspectorButton: {
    flex: 1,
    padding: 22,
  },
  inspectorButtonText: {
    color: textColor,
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  inspectorContent: {
    flex: 1,
    paddingTop: 5,
  },
  inspectorCount: {
    padding: 15,
    paddingBottom: 0,
  },
  inspectorCountText: {
    color: textColor,
    fontSize: 14,
  },
  inspectorWarning: {
    padding: 15,
    position: 'absolute',
    top: 39,
    bottom: 60,
  },
  inspectorWarningText: {
    color: textColor,
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  listRow: {
    position: 'relative',
    backgroundColor: backgroundColor(0.95),
    flex: 1,
    height: rowHeight,
    marginTop: rowGutter,
  },
  listRowContent: {
    flex: 1,
  },
  listRowCount: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  listRowText: {
    color: textColor,
    position: 'absolute',
    left: 0,
    top: Platform.OS === 'android' ? 5 : 7,
    marginLeft: 15,
    marginRight: 15,
  },
});

module.exports = YellowBox;
