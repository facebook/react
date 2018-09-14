/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('EventPluginRegistry', () => {
  let EventPluginRegistry;
  let createPlugin;

  // Function to perform common tests on top of EventPluginRegistry
  const testEventPlugin = (eventPluginOrder, eventPluginsByName) => {
    EventPluginRegistry.injectEventPluginOrder(eventPluginOrder);

    eventPluginsByName.forEach(pluginByName => {
      EventPluginRegistry.injectEventPluginsByName(pluginByName);
    });

    const mergedEventPluginsByName = Object.assign({}, ...eventPluginsByName);

    expect(EventPluginRegistry.plugins.length).toBe(eventPluginOrder.length);

    EventPluginRegistry.plugins.forEach((plugin, index) => {
      expect(mergedEventPluginsByName[eventPluginOrder[index]]).toBe(plugin);
    });
  };

  beforeEach(() => {
    jest.resetModuleRegistry();
    // These tests are intentionally testing the private injection interface.
    // The public API surface of this is covered by other tests so
    // if `EventPluginRegistry` is ever deleted, these tests should be
    // safe to remove too.
    EventPluginRegistry = require('events/EventPluginRegistry');

    createPlugin = function(properties) {
      return Object.assign({extractEvents: function() {}}, properties);
    };
  });

  it('should be able to inject ordering before plugins', () => {
    const [OnePlugin, TwoPlugin, ThreePlugin] = Array.from({length: 3}, () =>
      createPlugin(),
    );

    testEventPlugin(
      ['one', 'two', 'three'],
      [
        {
          one: OnePlugin,
          two: TwoPlugin,
          three: ThreePlugin,
        },
      ],
    );
  });

  it('should be able to inject plugins before and after ordering', () => {
    const [OnePlugin, TwoPlugin, ThreePlugin] = Array.from({length: 3}, () =>
      createPlugin(),
    );

    testEventPlugin(
      ['one', 'two', 'three'],
      [
        {
          one: OnePlugin,
          two: TwoPlugin,
        },
        {three: ThreePlugin},
      ],
    );
  });

  it('should be able to inject repeated plugins and out-of-order', () => {
    const [OnePlugin, TwoPlugin, ThreePlugin] = Array.from({length: 3}, () =>
      createPlugin(),
    );

    testEventPlugin(
      ['one', 'two', 'three'],
      [
        {
          one: OnePlugin,
          three: ThreePlugin,
        },
        {
          two: TwoPlugin,
          three: ThreePlugin,
        },
      ],
    );
  });

  it('should throw if plugin does not implement `extractEvents`', () => {
    const BadPlugin = {};

    EventPluginRegistry.injectEventPluginOrder(['bad']);

    expect(function() {
      EventPluginRegistry.injectEventPluginsByName({
        bad: BadPlugin,
      });
    }).toThrowError(
      'EventPluginRegistry: Event plugins must implement an `extractEvents` ' +
        'method, but `bad` does not.',
    );
  });

  it('should throw if plugin does not exist in ordering', () => {
    const [OnePlugin, RandomPlugin] = Array.from({length: 2}, () =>
      createPlugin(),
    );

    EventPluginRegistry.injectEventPluginOrder(['one']);

    expect(function() {
      EventPluginRegistry.injectEventPluginsByName({
        one: OnePlugin,
        random: RandomPlugin,
      });
    }).toThrowError(
      'EventPluginRegistry: Cannot inject event plugins that do not exist ' +
        'in the plugin ordering, `random`.',
    );
  });

  it('should throw if ordering is injected more than once', () => {
    const pluginOrdering = [];

    EventPluginRegistry.injectEventPluginOrder(pluginOrdering);

    expect(function() {
      EventPluginRegistry.injectEventPluginOrder(pluginOrdering);
    }).toThrowError(
      'EventPluginRegistry: Cannot inject event plugin ordering more than ' +
        'once. You are likely trying to load more than one copy of React.',
    );
  });

  it('should throw if different plugins injected using same name', () => {
    const [OnePlugin, TwoPlugin] = Array.from({length: 2}, () =>
      createPlugin(),
    );

    EventPluginRegistry.injectEventPluginsByName({same: OnePlugin});

    expect(function() {
      EventPluginRegistry.injectEventPluginsByName({same: TwoPlugin});
    }).toThrowError(
      'EventPluginRegistry: Cannot inject two different event plugins using ' +
        'the same name, `same`.',
    );
  });

  it('should publish registration names of injected plugins', () => {
    const OnePlugin = createPlugin({
      eventTypes: {
        click: {registrationName: 'onClick'},
        focus: {registrationName: 'onFocus'},
      },
    });
    const TwoPlugin = createPlugin({
      eventTypes: {
        magic: {
          phasedRegistrationNames: {
            bubbled: 'onMagicBubble',
            captured: 'onMagicCapture',
          },
        },
      },
    });

    EventPluginRegistry.injectEventPluginsByName({one: OnePlugin});
    EventPluginRegistry.injectEventPluginOrder(['one', 'two']);

    expect(
      Object.keys(EventPluginRegistry.registrationNameModules).length,
    ).toBe(2);
    expect(EventPluginRegistry.registrationNameModules.onClick).toBe(OnePlugin);
    expect(EventPluginRegistry.registrationNameModules.onFocus).toBe(OnePlugin);

    EventPluginRegistry.injectEventPluginsByName({two: TwoPlugin});

    expect(
      Object.keys(EventPluginRegistry.registrationNameModules).length,
    ).toBe(4);
    expect(EventPluginRegistry.registrationNameModules.onMagicBubble).toBe(
      TwoPlugin,
    );
    expect(EventPluginRegistry.registrationNameModules.onMagicCapture).toBe(
      TwoPlugin,
    );
  });

  it('should throw if multiple registration names collide', () => {
    const OnePlugin = createPlugin({
      eventTypes: {
        photoCapture: {registrationName: 'onPhotoCapture'},
      },
    });
    const TwoPlugin = createPlugin({
      eventTypes: {
        photo: {
          phasedRegistrationNames: {
            bubbled: 'onPhotoBubble',
            captured: 'onPhotoCapture',
          },
        },
      },
    });

    EventPluginRegistry.injectEventPluginsByName({
      one: OnePlugin,
      two: TwoPlugin,
    });

    expect(function() {
      EventPluginRegistry.injectEventPluginOrder(['one', 'two']);
    }).toThrowError(
      'EventPluginHub: More than one plugin attempted to publish the same ' +
        'registration name, `onPhotoCapture`.',
    );
  });

  it('should throw if an invalid event is published', () => {
    const OnePlugin = createPlugin({
      eventTypes: {
        badEvent: {
          /* missing configuration */
        },
      },
    });

    EventPluginRegistry.injectEventPluginsByName({one: OnePlugin});

    expect(function() {
      EventPluginRegistry.injectEventPluginOrder(['one']);
    }).toThrowError(
      'EventPluginRegistry: Failed to publish event `badEvent` for plugin ' +
        '`one`.',
    );
  });
});
