/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @flow
 * @haste-ignore
 * @preserve-whitespace
 */

/*
 * When an appplication disconnects from the notifications port we should clear
 * all notifications that the application has produced. This ensures that all
 * notifications will be removed in case we are unable to clear them from the
 * application.
 */
const NotitificationManager = {
  notifications: {},
  addNotificationId: function addNotificationId(sender, notificationId) {
    if (sender.tab !== undefined && sender.tab.id !== undefined) {
      const id = sender.tab.id;
      const notifications = this.notifications;

      if (notifications[id] === undefined) {
        notifications[id] = {};
      }

      notifications[id][notificationId] = true;
    }
  },
  clearAllNotifications: function clearAllNotifications(sender) {
    if (sender.tab !== undefined && sender.tab.id !== undefined) {
      const id = sender.tab.id;
      const notifications = this.notifications;

      if (notifications[id] !== undefined) {
        Object.keys(notifications[id]).forEach(notificationId => {
          try {
            chrome.notifications.clear(notificationId);
            // eslint-disable-next-line no-empty
          } catch {}
        });

        delete notifications[id];
      }
    }
  },
};

const desktopCaptureSources = Object.keys(
  chrome.desktopCapture.DesktopCaptureSourceType,
).reduce((sources, key) => {
  sources[chrome.desktopCapture.DesktopCaptureSourceType[key]] = key;
  return sources;
}, {});

(function externalMessageListener(
  runtime,
  desktopCapture,
  notifications,
  tabs,
  chromeWindows,
) {
  let requestID;

  runtime.onMessageExternal.addListener(onMessageExternal);

  function onMessageExternal(message, sender, respond) {
    switch (message.type) {
      case 'ping':
        respond({
          type: 'pong',
          features: [
            'cancelChooseDesktopMedia',
            'clearNotification',
            'createNotification',
            'focusTabAndWindow',
            'getAllNotifications',
            'getLastFocusedWindow',
            'getNotificationsPermissionLevel',
            'getStreamID',
            'getTabAndWindowForSender',
            'getTabForSender',
            'getWindow',
            'ping',
            'updateNotification',
            'updateTab',
            'updateWindow',
            'createWindow',
          ],
          version: runtime.getManifest().version,
        });
        break;

      case 'getStreamID':
        let sources = message.sources || ['audio', 'screen', 'window', 'tab'];
        // remove source types that are not supported by the platform or
        // browser version. older versions do not support "audio".
        sources = sources.filter(source => source in desktopCaptureSources);

        const tab = sender.tab;
        tab.url = sender.url;

        chooseDesktopMedia(sources, tab)
          .then(onStreamID)
          .catch(onError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        // indicate that this will be async
        return true;

      case 'cancel':
        const id = message.requestID || requestID;
        if (id) {
          desktopCapture.cancelChooseDesktopMedia(id);
          respond({
            type: 'canceled',
            requestID: id,
          });
        } else {
          throw new Error('REQUEST_ID_UNDEFINED');
        }

        break;

      case 'focusTabAndWindow':
        if (sender.tab === undefined) {
          respond({
            type: 'error',
            error: 'MESSAGESENDER_TAB_UNDEFINED',
          });
          return;
        }

        Promise.all([
          updateTab(sender.tab.id, {
            active: true,
          }),
          updateWindow(sender.tab.windowId, {
            focused: true,
          }),
        ])
          .then(results => ({
            type: 'focusTabAndWindow',
            tab: results[0],
            window: results[1],
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);

        return true;

      // Returns the active tab from the last window that had focus
      case 'getLastFocusedWindow':
        getLastFocusedWindow(message.getInfo)
          .then(window => ({
            type: 'getLastFocusedWindow',
            window: window,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'getTabForSender':
        respond({
          type: 'getTabForSender',
          tab: sender.tab,
        });
        break;

      case 'getTabAndWindowForSender':
        if (sender.tab === undefined) {
          respond({
            type: 'error',
            error: 'MESSAGESENDER_TAB_UNDEFINED',
          });
          return;
        }

        getWindow(sender.tab.windowId, {populate: true})
          .then(window => ({
            type: 'getTabAndWindowForSender',
            tab: sender.tab,
            window: window,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'getWindow':
        getWindow(message.windowId, message.getInfo)
          .then(window => ({
            type: 'getWindow',
            window: window,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'updateTab':
        updateTab(message.tabId, message.updateProperties)
          .then(tab => ({
            type: 'updateTab',
            tab: tab,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'updateWindow':
        updateWindow(message.windowId, message.updateInfo)
          .then(window => ({
            type: 'updateWindow',
            window: window,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'createWindow':
        createWindow(message.createData)
          .then(window => ({
            type: 'createWindow',
            window: window,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'clearNotification':
        clearNotification(message.notificationId)
          .then(wasCleared => ({
            type: 'clearNotification',
            wasCleared: wasCleared,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'createNotification':
        NotitificationManager.addNotificationId(sender, message.notificationId);

        createNotification(message.notificationId, message.options)
          .then(notificationId => ({
            type: 'createNotification',
            notificationId: notificationId,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'getAllNotifications':
        getAllNotifications()
          .then(notifications => ({
            type: 'getAllNotifications',
            notifications: notifications,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'getNotificationsPermissionLevel':
        getNotificationsPermissionLevel()
          .then(level => ({
            type: 'getNotificationsPermissionLevel',
            level: level,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;

      case 'updateNotification':
        updateNotification(message.notificationId, message.options)
          .then(wasUpdated => ({
            type: 'updateNotification',
            wasUpdated: wasUpdated,
          }))
          .catch(respondError)
          // eslint-disable-next-line fb-www/promise-termination
          .then(respond);
        return true;
    }

    function chooseDesktopMedia(sources, tab) {
      return new Promise((resolve, reject) => {
        function cb(streamID, options) {
          if (runtime.lastError !== undefined) {
            reject(new Error(runtime.lastError.message));
          } else {
            resolve({
              streamID: streamID,
              options: options,
            });
          }
        }

        try {
          requestID = desktopCapture.chooseDesktopMedia(sources, tab, cb);
        } catch (e) {
          reject(e);
        }
      }).catch(err => {
        if (
          // older version of chrome, try again without "tab" option
          err.message.toLowerCase().indexOf('tab capture is not supported') > -1
        ) {
          const filteredSources = sources.filter(source => source !== 'tab');
          return chooseDesktopMedia(filteredSources, tab);
        }

        throw err;
      });
    }

    function onStreamID(result) {
      if (!result.streamID) {
        throw new Error('canceled');
      }

      return {
        type: 'streamID',
        streamID: result.streamID,
        options: result.options,
        requestID: requestID,
      };
    }

    function onError(error) {
      return {
        type: 'canceledGetStreamID',
        error: error,
      };
    }

    function respondError(error) {
      return {
        type: 'error',
        message: error.message,
      };
    }

    function getLastFocusedWindow(getInfo) {
      return new Promise((resolve, reject) => {
        try {
          chromeWindows.getLastFocused(
            getInfo,
            checkLastError(resolve, reject),
          );
        } catch (e) {
          reject(e);
        }
      });
    }

    function getWindow(windowId, getInfo) {
      return new Promise((resolve, reject) => {
        try {
          chromeWindows.get(windowId, getInfo, checkLastError(resolve, reject));
        } catch (e) {
          reject(e);
        }
      });
    }

    function updateTab(tabId, updateProperties) {
      return new Promise((resolve, reject) => {
        try {
          tabs.update(tabId, updateProperties, checkLastError(resolve, reject));
        } catch (e) {
          reject(e);
        }
      });
    }

    function updateWindow(windowId, updateInfo) {
      return new Promise((resolve, reject) => {
        try {
          chromeWindows.update(
            windowId,
            updateInfo,
            checkLastError(resolve, reject),
          );
        } catch (e) {
          reject(e);
        }
      });
    }

    function createWindow(createData) {
      return new Promise((resolve, reject) => {
        try {
          chromeWindows.create(
            createData,
            checkLastError(resolve, reject),
          );
        } catch (e) {
          reject(e);
        }
      });
    }

    // notifications

    function clearNotification(notificationId) {
      return new Promise((resolve, reject) => {
        try {
          notifications.clear(notificationId, checkLastError(resolve, reject));
        } catch (e) {
          reject(e);
        }
      });
    }

    function createNotification(notificationId, options) {
      return new Promise((resolve, reject) => {
        try {
          notifications.create(
            notificationId,
            options,
            checkLastError(resolve, reject),
          );
        } catch (e) {
          reject(e);
        }
      });
    }

    function getAllNotifications() {
      return new Promise((resolve, reject) => {
        try {
          notifications.getAll(checkLastError(resolve, reject));
        } catch (e) {
          reject(e);
        }
      });
    }

    function getNotificationsPermissionLevel() {
      return new Promise((resolve, reject) => {
        try {
          notifications.getPermissionLevel(checkLastError(resolve, reject));
        } catch (e) {
          reject(e);
        }
      });
    }

    function updateNotification(notificationId, options) {
      return new Promise((resolve, reject) => {
        try {
          notifications.update(
            notificationId,
            options,
            checkLastError(resolve, reject),
          );
        } catch (e) {
          reject(e);
        }
      });
    }

    // helper
    function checkLastError(resolve, reject) {
      return function() {
        if (runtime.lastError !== undefined) {
          reject(new Error(runtime.lastError.message));
        } else {
          resolve.apply(null, arguments);
        }
      };
    }
  }
})(
  chrome.runtime,
  chrome.desktopCapture,
  chrome.notifications,
  chrome.tabs,
  chrome.windows,
);

(function notificationEventListener(runtime, notifications) {
  function onButtonClicked(port, notificationId, buttonIndex) {
    port.postMessage({
      type: 'notificationButtonClicked',
      notificationId: notificationId,
      buttonIndex: buttonIndex,
    });
  }

  function onClicked(port, notificationId) {
    port.postMessage({
      type: 'notificationClicked',
      notificationId: notificationId,
    });
  }

  function onClosed(port, notificationId, byUser) {
    port.postMessage({
      type: 'notificationClosed',
      notificationId: notificationId,
      byUser: byUser,
    });
  }

  function onConnect(port) {
    if (port.name === 'notifications') {
      const _onButtonClicked = onButtonClicked.bind(null, port);
      const _onClicked = onClicked.bind(null, port);
      const _onClosed = onClosed.bind(null, port);

      notifications.onButtonClicked.addListener(_onButtonClicked);
      notifications.onClicked.addListener(_onClicked);
      notifications.onClosed.addListener(_onClosed);

      port.onDisconnect.addListener(port => {
        notifications.onButtonClicked.removeListener(_onButtonClicked);
        notifications.onClicked.removeListener(_onClicked);
        notifications.onClosed.removeListener(_onClosed);
        NotitificationManager.clearAllNotifications(port.sender);
      });
    }
  }

  runtime.onConnectExternal.addListener(onConnect);
})(chrome.runtime, chrome.notifications);
