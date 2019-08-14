// @flow

'use strict';

declare var chrome: {
  devtools: {
    network: {
      onNavigated: {
        addListener: (cb: (url: string) => void) => void,
        removeListener: (cb: () => void) => void,
      },
    },
    inspectedWindow: {
      eval: (code: string, cb?: (res: any, err: ?Object) => any) => void,
      tabId: number,
    },
    panels: {
      create: (
        title: string,
        icon: string,
        filename: string,
        cb: (panel: {
          onHidden: {
            addListener: (cb: (window: Object) => void) => void,
          },
          onShown: {
            addListener: (cb: (window: Object) => void) => void,
          },
        }) => void
      ) => void,
      themeName: ?string,
    },
  },
  tabs: {
    create: (options: Object) => void,
    executeScript: (tabId: number, options: Object, fn: () => void) => void,
    onUpdated: {
      addListener: (
        fn: (tabId: number, changeInfo: Object, tab: Object) => void
      ) => void,
    },
    query: (options: Object, fn: (tabArray: Array<Object>) => void) => void,
  },
  browserAction: {
    setIcon: (options: {
      tabId: number,
      path: {[key: string]: string},
    }) => void,
    setPopup: (options: {
      tabId: number,
      popup: string,
    }) => void,
  },
  runtime: {
    getURL: (path: string) => string,
    sendMessage: (config: Object) => void,
    connect: (
      config: Object
    ) => {
      disconnect: () => void,
      onMessage: {
        addListener: (fn: (message: Object) => void) => void,
      },
      onDisconnect: {
        addListener: (fn: (message: Object) => void) => void,
      },
      postMessage: (data: Object) => void,
    },
    onConnect: {
      addListener: (
        fn: (port: {
          name: string,
          sender: {
            tab: {
              id: number,
              url: string,
            },
          },
        }) => void
      ) => void,
    },
    onMessage: {
      addListener: (
        fn: (
          req: Object,
          sender: {
            url: string,
            tab: {
              id: number,
            },
          }
        ) => void
      ) => void,
    },
  },
};
