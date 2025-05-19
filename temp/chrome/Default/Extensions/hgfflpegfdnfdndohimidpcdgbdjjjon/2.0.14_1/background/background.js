/*
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * Background script that processes keypresses, credentials, warnings, and
 * notifications. Receives keypresses, credentials, and context from the content
 * scripts.
 *
 * @providesModule background
 * @format
 */

if (typeof thiIsChrome == 'undefined') {
    const initBackground = require("./background-helpers").initBackground;
}

initBackground();
