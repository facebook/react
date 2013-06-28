/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule CallbackRegistry
 */

"use strict";

var listenerBank = {};

/**
 * Stores "listeners" by `registrationName`/`id`. There should be at most one
 * "listener" per `registrationName/id` in the `listenerBank`.
 * Access listeners via `listenerBank[registrationName][id]`
 *
 * @constructor CallbackRegistry
 */
var CallbackRegistry = {

  /**
   * Stores `listener` at `listenerBank[registrationName][id]. Is idempotent.
   * @param {string} domID The id of the DOM node.
   * @param {string} registrationName The name of listener (`onClick` etc).
   * @param {Function} listener The callback to to store.
   */
  putListener: function(id, registrationName, listener) {
    var bankForRegistrationName =
      listenerBank[registrationName] || (listenerBank[registrationName] = {});
    bankForRegistrationName[id] = listener;
  },

  /**
   * @param {string} id.
   * @param {string} registrationName Name of registration (`onClick` etc).
   * @return {Function?} The Listener
   */
  getListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    return bankForRegistrationName && bankForRegistrationName[id];
  },

  /**
   * Deletes the listener from the registration bank.
   * @param {string} id
   * @param {string} registrationName (`onClick` etc).
   */
  deleteListener: function(id, registrationName) {
    var bankForRegistrationName = listenerBank[registrationName];
    if (bankForRegistrationName) {
      delete bankForRegistrationName[id];
    }
  },

  // This is needed for tests only. Do not use in real life
  __purge: function() {
    listenerBank = {};
  }
};

module.exports = CallbackRegistry;
