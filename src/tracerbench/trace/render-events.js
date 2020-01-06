import binsearch from 'array-binsearch';
import { getChildren } from './cpu-profile';
import { TRACE_EVENT_PHASE_COMPLETE, TRACE_EVENT_PHASE_NESTABLE_ASYNC_END, TRACE_EVENT_PHASE_NESTABLE_ASYNC_BEGIN, } from './trace_event';
const cloneDeep = require('lodash.clonedeep');
export function addRenderNodes(hierarchy, events) {
    events.forEach(event => {
        if (!isRenderPhase(event)) {
            return;
        }
        let found = null;
        // Search for the closest node which fully encloses the render event
        hierarchy.eachBefore((node) => {
            if (nodeEnclosesEvent(node, event)) {
                found = node;
            }
        });
        if (found) {
            insertRenderEvent(found, event);
        }
    });
}
function nodeEnclosesEvent(node, event) {
    return (node.data.min !== -1 &&
        node.data.max !== -1 &&
        node.data.min < event.ts &&
        event.ts + event.dur < node.data.max);
}
function insertRenderEvent(enclosingNode, event) {
    const eventStart = event.ts;
    const eventEnd = event.ts + event.dur;
    const renderNode = enclosingNode.copy();
    renderNode.data = {
        id: -1,
        callFrame: {
            functionName: event.name,
            scriptId: -1,
            url: '',
            lineNumber: -1,
            columnNumber: -1,
        },
        children: [],
        sampleCount: -1,
        min: eventStart,
        max: eventEnd,
        total: 0,
        self: 0,
    };
    const children = getChildren(enclosingNode);
    // Children who are fully to the left or right of the render event
    const childrenForOriginal = children.filter(child => child.data.max < eventStart || child.data.min > eventEnd);
    // Children who are fully within the render event
    const childrenForRenderNode = children.filter(child => child.data.min > eventStart && child.data.max < eventEnd);
    // Children who are split by the render event
    const leftSplitChild = children.find(n => n.data.min < eventStart && n.data.max > eventStart);
    const rightSplitChild = children.find(n => n.data.min < eventEnd && n.data.max > eventEnd);
    // Fix parent/child links for all children other then split children
    enclosingNode.children = childrenForOriginal;
    renderNode.children = childrenForRenderNode;
    childrenForRenderNode.forEach(child => (child.parent = renderNode));
    // fix node/render node parent/child link
    renderNode.parent = enclosingNode;
    insertChildInOrder(enclosingNode.children, renderNode);
    splitChild(enclosingNode, renderNode, leftSplitChild, eventStart);
    splitChild(renderNode, enclosingNode, rightSplitChild, eventEnd);
}
function insertChildInOrder(children, node) {
    let index = binsearch(children, node, (a, b) => a.data.min - b.data.min);
    if (index < 0) {
        /* tslint:disable:no-bitwise */
        index = ~index;
    }
    else {
        // insert just after if ts order matched
        index++;
    }
    children.splice(index, 0, node);
}
function splitChild(leftParent, rightParent, node, splitTS) {
    if (node === undefined) {
        return { middleLeftTime: 0, middleRightTime: 0 };
    }
    // Split node
    const left = node;
    const right = node.copy();
    right.data = cloneDeep(node.data);
    right.children = [];
    left.data.max = splitTS;
    right.data.min = splitTS;
    // Add back in the child/parent links for the split node
    left.parent = leftParent;
    right.parent = rightParent;
    insertChildInOrder(getChildren(leftParent), left);
    insertChildInOrder(getChildren(rightParent), right);
    const children = getChildren(node);
    // If no further decendents, you are done
    if (children.length === 0) {
        left.data.self = left.data.max - left.data.min;
        right.data.self = right.data.max - right.data.min;
        return { middleLeftTime: left.data.self, middleRightTime: right.data.self };
    }
    // Reasign children correctly
    const middleChild = children.find(n => n.data.min < splitTS && n.data.max > splitTS);
    const leftChildren = children.filter(child => child.data.max < left.data.max);
    const rightChildren = children.filter(child => child.data.min > right.data.min);
    left.children = leftChildren;
    right.children = rightChildren;
    // Start to sum self time of children
    let leftChildrenTime = leftChildren.reduce((a, b) => a + b.data.self, 0);
    let righChildrentTime = rightChildren.reduce((a, b) => a + b.data.self, 0);
    // Split middle child and asign the resulting left/right node self times
    const { middleLeftTime, middleRightTime } = splitChild(left, right, middleChild, splitTS);
    leftChildrenTime += middleLeftTime;
    righChildrentTime += middleRightTime;
    left.data.self = left.data.max - left.data.min - leftChildrenTime;
    right.data.self = right.data.max - right.data.min - righChildrentTime;
    // Return the resulting left/right split times, so parents can determine their own self times
    return {
        middleLeftTime: left.data.max - left.data.min,
        middleRightTime: right.data.max - right.data.min,
    };
}
export function isRenderEnd(event) {
    return (event.ph === TRACE_EVENT_PHASE_NESTABLE_ASYNC_END && isRender(event.name));
}
export function isRenderStart(event) {
    return (event.ph === TRACE_EVENT_PHASE_NESTABLE_ASYNC_BEGIN && isRender(event.name));
}
function isRenderPhase(event) {
    return event.ph === TRACE_EVENT_PHASE_COMPLETE && isRender(event.name);
}
export function isRenderNode(node) {
    return isRender(node.data.callFrame.functionName);
}
function isRender(name) {
    return (name.endsWith('(Rendering: initial)') ||
        name.endsWith('(Rendering: update)') ||
        name.endsWith('(Rendering: outlet)'));
}
