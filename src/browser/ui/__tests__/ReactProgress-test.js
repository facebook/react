/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @jsx React.DOM
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactMount = require('ReactMount');
var ReactTestUtils = require('ReactTestUtils');
var reactComponentExpect = require('reactComponentExpect');

describe('ReactProgress', function() {
	it("should revert progress elements to intermidiate state when nulling their values", function() {		
		var Progress = React.createClass({
		    getInitialState: function () {
		        return {
		            progress: 50		            
		        };
		    },
		    clickHandler: function() {		        
		    	this.setState({progress: null});
		    },		    
		    render: function() {
		        return (
		            <progress progressValue={this.state.progress} max="100" onClick={this.clickHandler} />		            
		        );
		    }
		});
		
		var instance = ReactTestUtils.renderIntoDocument(<Progress />);

		var renderedChild = reactComponentExpect(instance)
		      .expectRenderedChild()
		      .instance();

		ReactTestUtils.Simulate.click(renderedChild);

		var domNode = ReactMount.getNode(instance._rootNodeID);
		
		expect(domNode.position).toBe(-1);
	});
});
