function treeToArray(root) {
    const nodes = [];
    function visit(node) {
        nodes.push({
            id: node.id,
            callFrame: {
                columnNumber: 0,
                functionName: node.functionName,
                lineNumber: node.lineNumber,
                scriptId: node.scriptId,
                url: node.url,
            },
            hitCount: node.hitCount,
            children: node.children.map(child => child.id),
        });
        node.children.forEach(visit);
    }
    visit(root);
    return nodes;
}
function timestampsToDeltas(timestamps, startTime) {
    return timestamps.map((timestamp, index) => {
        const lastTimestamp = index === 0 ? startTime * 1000000 : timestamps[index - 1];
        return timestamp - lastTimestamp;
    });
}
/**
 * Convert the old tree-based format to the new flat-array based format
 */
export function chromeTreeToNodes(content) {
    // Note that both startTime and endTime are now in microseconds
    return {
        samples: content.samples,
        startTime: content.startTime * 1000000,
        endTime: content.endTime * 1000000,
        nodes: treeToArray(content.head),
        timeDeltas: timestampsToDeltas(content.timestamps, content.startTime),
    };
}
