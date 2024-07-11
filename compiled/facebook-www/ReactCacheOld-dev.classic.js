/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

"use strict";
__DEV__ &&
  (function () {
    function error$jscomp$0(format) {
      for (
        var _len2 = arguments.length,
          args = Array(1 < _len2 ? _len2 - 1 : 0),
          _key2 = 1;
        _key2 < _len2;
        _key2++
      )
        args[_key2 - 1] = arguments[_key2];
      _len2 = format;
      _key2 =
        require("react").__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      null != _key2 &&
        _key2.getCurrentStack &&
        ((_key2 = _key2.getCurrentStack()),
        "" !== _key2 && ((_len2 += "%s"), args.push(_key2)));
      args.unshift(_len2);
      args.unshift(!1);
      warningWWW.apply(null, args);
    }
    function readContext(Context) {
      var dispatcher = SharedInternals.H;
      if (null === dispatcher)
        throw Error(
          "react-cache: read and preload may only be called from within a component's render. They are not supported in event handlers or lifecycle methods."
        );
      return dispatcher.readContext(Context);
    }
    function identityHashFn(input) {
      "string" !== typeof input &&
        "number" !== typeof input &&
        "boolean" !== typeof input &&
        void 0 !== input &&
        null !== input &&
        error$jscomp$0(
          "Invalid key type. Expected a string, number, symbol, or boolean, but instead received: %s\n\nTo use non-primitive values as keys, you must pass a hash function as the second argument to createResource().",
          input
        );
      return input;
    }
    function accessResult(resource, fetch, input, key) {
      var entriesForResource = entries.get(resource);
      void 0 === entriesForResource &&
        ((entriesForResource = new Map()),
        entries.set(resource, entriesForResource));
      var entry = entriesForResource.get(key);
      if (void 0 === entry) {
        fetch = fetch(input);
        fetch.then(
          function (value) {
            if (0 === newResult.status) {
              var resolvedResult = newResult;
              resolvedResult.status = 1;
              resolvedResult.value = value;
            }
          },
          function (error) {
            if (0 === newResult.status) {
              var rejectedResult = newResult;
              rejectedResult.status = 2;
              rejectedResult.value = error;
            }
          }
        );
        var newResult = { status: 0, value: fetch };
        resource = lru.add(newResult, deleteEntry.bind(null, resource, key));
        entriesForResource.set(key, resource);
        return newResult;
      }
      return lru.access(entry);
    }
    function deleteEntry(resource, key) {
      var entriesForResource = entries.get(resource);
      void 0 !== entriesForResource &&
        (entriesForResource.delete(key),
        0 === entriesForResource.size && entries.delete(resource));
    }
    var React = require("react"),
      Scheduler = require("scheduler"),
      warningWWW = require("warning"),
      scheduleCallback = Scheduler.unstable_scheduleCallback,
      IdlePriority = Scheduler.unstable_IdlePriority,
      SharedInternals =
        React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
      lru = (function (limit) {
        function scheduleCleanUp() {
          !1 === cleanUpIsScheduled &&
            size > LIMIT &&
            ((cleanUpIsScheduled = !0),
            scheduleCallback(IdlePriority, cleanUp));
        }
        function cleanUp() {
          cleanUpIsScheduled = !1;
          var targetSize = LIMIT;
          if (null !== first)
            for (
              var last = first.previous;
              size > targetSize && null !== last;

            ) {
              var onDelete = last.onDelete,
                previous = last.previous;
              last.onDelete = null;
              last.previous = last.next = null;
              last === first
                ? (first = last = null)
                : ((first.previous = previous),
                  (previous.next = first),
                  (last = previous));
              --size;
              onDelete();
            }
        }
        var LIMIT = limit,
          first = null,
          size = 0,
          cleanUpIsScheduled = !1;
        return {
          add: function (value, onDelete) {
            value = {
              value: value,
              onDelete: onDelete,
              next: null,
              previous: null
            };
            null === first
              ? (value.previous = value.next = value)
              : ((onDelete = first.previous),
                (onDelete.next = value),
                (value.previous = onDelete),
                (first.previous = value),
                (value.next = first));
            first = value;
            size += 1;
            return value;
          },
          update: function (entry, newValue) {
            entry.value = newValue;
          },
          access: function (entry) {
            var next = entry.next;
            if (null !== next) {
              var resolvedFirst = first;
              if (first !== entry) {
                var previous = entry.previous;
                previous.next = next;
                next.previous = previous;
                next = resolvedFirst.previous;
                next.next = entry;
                entry.previous = next;
                resolvedFirst.previous = entry;
                entry.next = resolvedFirst;
                first = entry;
              }
            }
            scheduleCleanUp();
            return entry.value;
          },
          setLimit: function (newLimit) {
            LIMIT = newLimit;
            scheduleCleanUp();
          }
        };
      })(500),
      entries = new Map(),
      CacheContext = React.createContext(null);
    exports.unstable_createResource = function (fetch, maybeHashInput) {
      var hashInput =
          void 0 !== maybeHashInput ? maybeHashInput : identityHashFn,
        resource = {
          read: function (input) {
            readContext(CacheContext);
            var key = hashInput(input);
            input = accessResult(resource, fetch, input, key);
            switch (input.status) {
              case 0:
                throw input.value;
              case 1:
                return input.value;
              case 2:
                throw input.value;
            }
          },
          preload: function (input) {
            readContext(CacheContext);
            var key = hashInput(input);
            accessResult(resource, fetch, input, key);
          }
        };
      return resource;
    };
    exports.unstable_setGlobalCacheLimit = function (limit) {
      lru.setLimit(limit);
    };
  })();
