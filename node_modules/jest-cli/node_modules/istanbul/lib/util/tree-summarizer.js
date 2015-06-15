/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    SEP = path.sep || '/',
    utils = require('../object-utils');

function commonArrayPrefix(first, second) {
    var len = first.length < second.length ? first.length : second.length,
        i,
        ret = [];
    for (i = 0; i < len; i += 1) {
        if (first[i] === second[i]) {
            ret.push(first[i]);
        } else {
            break;
        }
    }
    return ret;
}

function findCommonArrayPrefix(args) {
    if (args.length === 0) {
        return [];
    }

    var separated = args.map(function (arg) { return arg.split(SEP); }),
        ret = separated.pop();

    if (separated.length === 0) {
        return ret.slice(0, ret.length - 1);
    } else {
        return separated.reduce(commonArrayPrefix, ret);
    }
}

function Node(fullName, kind, metrics) {
    this.name = fullName;
    this.fullName = fullName;
    this.kind = kind;
    this.metrics = metrics || null;
    this.parent = null;
    this.children = [];
}

Node.prototype = {
    displayShortName: function () {
        return this.relativeName;
    },
    fullPath: function () {
        return this.fullName;
    },
    addChild: function (child) {
        this.children.push(child);
        child.parent = this;
    },
    toJSON: function () {
        return {
            name: this.name,
            relativeName: this.relativeName,
            fullName: this.fullName,
            kind: this.kind,
            metrics: this.metrics,
            parent: this.parent === null ? null : this.parent.name,
            children: this.children.map(function (node) { return node.toJSON(); })
        };
    }
};

function TreeSummary(summaryMap, commonPrefix) {
    this.prefix = commonPrefix;
    this.convertToTree(summaryMap, commonPrefix);
}

TreeSummary.prototype = {
    getNode: function (shortName) {
        return this.map[shortName];
    },
    convertToTree: function (summaryMap, arrayPrefix) {
        var nodes = [],
            rootPath = arrayPrefix.join(SEP) + SEP,
            root = new Node(rootPath, 'dir'),
            tmp,
            tmpChildren,
            seen = {},
            filesUnderRoot = false;

        seen[rootPath] = root;
        Object.keys(summaryMap).forEach(function (key) {
            var metrics = summaryMap[key],
                node,
                parentPath,
                parent;
            node = new Node(key, 'file', metrics);
            seen[key] = node;
            nodes.push(node);
            parentPath = path.dirname(key) + SEP;
            if (parentPath === SEP + SEP || parentPath === '.' + SEP) {
                parentPath = SEP + '__root__' + SEP;
            }
            parent = seen[parentPath];
            if (!parent) {
                parent = new Node(parentPath, 'dir');
                root.addChild(parent);
                seen[parentPath] = parent;
            }
            parent.addChild(node);
            if (parent === root) { filesUnderRoot = true; }
        });

        if (filesUnderRoot && arrayPrefix.length > 0) {
            arrayPrefix.pop(); //start at one level above
            tmp = root;
            tmpChildren = tmp.children;
            tmp.children = [];
            root = new Node(arrayPrefix.join(SEP) + SEP, 'dir');
            root.addChild(tmp);
            tmpChildren.forEach(function (child) {
                if (child.kind === 'dir') {
                    root.addChild(child);
                } else {
                    tmp.addChild(child);
                }
            });
        }
        this.fixupNodes(root, arrayPrefix.join(SEP) + SEP);
        this.calculateMetrics(root);
        this.root = root;
        this.map = {};
        this.indexAndSortTree(root, this.map);
    },

    fixupNodes: function (node, prefix, parent) {
        var that = this;
        if (node.name.indexOf(prefix) === 0) {
            node.name = node.name.substring(prefix.length);
        }
        if (node.name.charAt(0) === SEP) {
            node.name = node.name.substring(1);
        }
        if (parent) {
            if (parent.name !== '__root__' + SEP) {
                node.relativeName = node.name.substring(parent.name.length);
            } else {
                node.relativeName = node.name;
            }
        } else {
            node.relativeName = node.name.substring(prefix.length);
        }
        node.children.forEach(function (child) {
            that.fixupNodes(child, prefix, node);
        });
    },
    calculateMetrics: function (entry) {
        var that = this,
            fileChildren;
        if (entry.kind !== 'dir') {return; }
        entry.children.forEach(function (child) {
            that.calculateMetrics(child);
        });
        entry.metrics = utils.mergeSummaryObjects.apply(
            null,
            entry.children.map(function (child) { return child.metrics; })
        );
        // calclulate "java-style" package metrics where there is no hierarchy
        // across packages
        fileChildren = entry.children.filter(function (n) { return n.kind !== 'dir'; });
        if (fileChildren.length > 0) {
            entry.packageMetrics = utils.mergeSummaryObjects.apply(
                null,
                fileChildren.map(function (child) { return child.metrics; })
            );
        } else {
            entry.packageMetrics = null;
        }
    },
    indexAndSortTree: function (node, map) {
        var that = this;
        map[node.name] = node;
        node.children.sort(function (a, b) {
            a = a.relativeName;
            b = b.relativeName;
            return a < b ? -1 : a > b ? 1 : 0;
        });
        node.children.forEach(function (child) {
            that.indexAndSortTree(child, map);
        });
    },
    toJSON: function () {
        return {
            prefix: this.prefix,
            root: this.root.toJSON()
        };
    }
};

function TreeSummarizer() {
    this.summaryMap = {};
}

TreeSummarizer.prototype = {
    addFileCoverageSummary: function (filePath, metrics) {
        this.summaryMap[filePath] = metrics;
    },
    getTreeSummary: function () {
        var commonArrayPrefix = findCommonArrayPrefix(Object.keys(this.summaryMap));
        return new TreeSummary(this.summaryMap, commonArrayPrefix);
    }
};

module.exports = TreeSummarizer;
