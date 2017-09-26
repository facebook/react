/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule createClass
 */

'use strict';

var {Component} = require('ReactBaseClasses');
var {isValidElement} = require('ReactElement');
var ReactNoopUpdateQueue = require('ReactNoopUpdateQueue');
var factory = require('create-react-class/factory');

module.exports = factory(Component, isValidElement, ReactNoopUpdateQueue);
