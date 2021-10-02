/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const express = require('express')
const app = express()
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

 const React = require('react');
 const ReactDOM = require('react-dom');
 const PropTypes = require('prop-types');
  
 
   it('should unwind namespaces on uncaught errors', () => {
     function BrokenRender() {
       throw new Error('Hello');
     }
 
    },() => {
       assertNamespacesMatch(
         <svg {...expectSVG}>
           <BrokenRender />
         </svg>,
       )})