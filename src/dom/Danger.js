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
 * @providesModule Danger
 * @typechecks static-only
 */

/*jslint evil: true, sub: true */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');

var createNodesFromMarkup = require('createNodesFromMarkup');
var emptyFunction = require('emptyFunction');
var getMarkupWrap = require('getMarkupWrap');
var invariant = require('invariant');
var mutateHTMLNodeWithMarkup = require('mutateHTMLNodeWithMarkup');

var COMMENT_NODE_TYPE = 8;

// This buffer will be reused in dangerouslyRenderMarkup to avoid unnecessary
// array allocations.
var reusableBuffer = [];

/**
 * Extracts the `nodeName` from a string of markup.
 *
 * NOTE: Extracting the `nodeName` does not require a regular expression match
 * because we make assumptions about React-generated markup (i.e. there are no
 * spaces surrounding the opening tag and there is at least one attribute).
 *
 * @param {string} markup String of markup.
 * @return {string} Node name of the supplied markup.
 * @see http://jsperf.com/extract-nodename
 */
function getNodeName(markup) {
  return markup.substring(1, markup.indexOf(' '));
}

var Danger = {

  /**
   * Renders markup into an array of nodes. The markup is expected to render
   * into a list of root nodes. Also, the length of `resultList` and
   * `markupList` should be the same.
   *
   * @param {array<string>} markupList List of markup strings to render.
   * @return {array<DOMElement>} List of rendered nodes.
   * @internal
   */
  dangerouslyRenderMarkup: function(markupList) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyRenderMarkup(...): Cannot render markup in a Worker ' +
      'thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    );
    var nodeName;
    var markupByNodeName = {};
    // Group markup by `nodeName` if a wrap is necessary, else by '*'.
    for (var i = 0; i < markupList.length; i++) {
      invariant(
        markupList[i],
        'dangerouslyRenderMarkup(...): Missing markup.'
      );
      nodeName = getNodeName(markupList[i]);
      nodeName = getMarkupWrap(nodeName) ? nodeName : '*';
      markupByNodeName[nodeName] = markupByNodeName[nodeName] || [];
      markupByNodeName[nodeName][i] = markupList[i];
    }
    var resultList = [];
    var resultListAssignmentCount = 0;
    for (nodeName in markupByNodeName) {
      if (!markupByNodeName.hasOwnProperty(nodeName)) {
        continue;
      }
      var markupListByNodeName = markupByNodeName[nodeName];

      var commentedMarkupList = reusableBuffer;
      commentedMarkupList.length = 0;

      // This for-in loop skips the holes of the sparse array. The order of
      // iteration should follow the order of assignment, which happens to match
      // numerical index order, but we don't rely on that.
      for (var resultIndex in markupListByNodeName) {
        if (markupListByNodeName.hasOwnProperty(resultIndex)) {
          // Push the requested markup followed by a sentinel HTML
          // comment. Comments are a good choice for sentinels because they can
          // appear as children of any HTML node.
          commentedMarkupList.push(
            markupListByNodeName[resultIndex],
            // This resultIndex will be parsed back out below.
            '<!--danger:', resultIndex, '-->'
          );
        }
      }

      // Render each group of markup with similar wrapping `nodeName`, with
      // sentinel comments interspersed.
      var renderNodes = createNodesFromMarkup(
        commentedMarkupList.join(''),
        emptyFunction // Do nothing special with <script> tags.
      );

      var renderBuffer = reusableBuffer;
      renderBuffer.length = 0;

      for (i = 0; i < renderNodes.length; ++i) {
        var renderNode = renderNodes[i];
        if (renderNode.nodeType !== COMMENT_NODE_TYPE) {
          // Append all non-comment nodes to the buffer.
          renderBuffer.push(renderNode);

        } else {
          var comment = renderNode.nodeValue.split(':');
          if (comment[0] === 'danger') {
            resultIndex = comment[1];
            invariant(
              !resultList.hasOwnProperty(resultIndex),
              'Danger: Assigning to an already-occupied result index.'
            );

            // Take the first node no matter how many were rendered.
            resultList[resultIndex] = renderBuffer[0] || null;

            if (__DEV__) {
              if (renderBuffer.length !== 1) {
                var args = [
                  "Danger: '" + markupListByNodeName[resultIndex] + "' " +
                  "rendered as " + renderBuffer.length + " nodes instead of 1:"
                ];

                // Pass the nodes as arguments to console.error so that they can
                // be inspected in the browser.
                args.push.apply(args, renderBuffer);

                // Use console.error instead of throwing so that we don't
                // interfere with the rendering of other markup.
                console.error.apply(console, args);
              }
            }

            // Empty the buffer after assigning its contents to
            // resultList[resultIndex];
            renderBuffer.length = 0;

            // This should match resultList.length and markupList.length when
            // we're done.
            resultListAssignmentCount += 1;

          } else {
            // It's some other kind of comment that we didn't create.  Weirder
            // things have happened.
            renderBuffer.push(renderNode);
            console.warn(
              'Danger: Markup unexpectedly rendered a comment node:',
              '<!--' + renderNode.nodeValue + '-->.'
            );
          }
        }
      }
    }

    invariant(
      reusableBuffer.length === 0,
      'Danger: Rendered malformed markup: %s.',
      reusableBuffer
    );

    // Although resultList was populated out of order, it should now be a dense
    // array.
    invariant(
      resultListAssignmentCount === resultList.length,
      'Danger: Did not assign to every index of resultList.'
    );

    invariant(
      resultList.length === markupList.length,
      'Danger: Expected markup to render %d nodes, but rendered %d.',
      markupList.length,
      resultList.length
    );

    return resultList;
  },

  /**
   * Replaces a node with a string of markup at its current position within its
   * parent. The markup must render into a single root node.
   *
   * @param {DOMElement} oldChild Child node to replace.
   * @param {string} markup Markup to render in place of the child node.
   * @internal
   */
  dangerouslyReplaceNodeWithMarkup: function(oldChild, markup) {
    invariant(
      ExecutionEnvironment.canUseDOM,
      'dangerouslyReplaceNodeWithMarkup(...): Cannot render markup in a ' +
      'worker thread. This is likely a bug in the framework. Please report ' +
      'immediately.'
    );
    invariant(markup, 'dangerouslyReplaceNodeWithMarkup(...): Missing markup.');
    // createNodesFromMarkup() won't work if the markup is rooted by <html>
    // since it has special semantic meaning. So we use an alternatie strategy.
    if (oldChild.tagName.toLowerCase() === 'html') {
      mutateHTMLNodeWithMarkup(oldChild, markup);
      return;
    }
    var newChild = createNodesFromMarkup(markup, emptyFunction)[0];
    oldChild.parentNode.replaceChild(newChild, oldChild);
  }

};

module.exports = Danger;
