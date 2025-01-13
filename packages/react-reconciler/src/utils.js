import React from 'react';

export async function preloadModules(tree) {
    const components = new Set();
    traverseTree(tree, (type) => components.add(type));
    await Promise.all(
        [...components].map((type) => import(`my-module-path/${type}`))
    );
}

function traverseTree(node, callback) {
    if (!node) return;
    if (typeof node.type === 'string') callback(node.type);
    if (node.props && node.props.children) {
        React.Children.forEach(node.props.children, (child) =>
            traverseTree(child, callback)
        );
    }
}
