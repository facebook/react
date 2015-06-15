/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    mkdirp = require('mkdirp'),
    util = require('util'),
    fs = require('fs'),
    defaults = require('./common/defaults'),
    Report = require('./index'),
    TreeSummarizer = require('../util/tree-summarizer'),
    utils = require('../object-utils'),
    PCT_COLS = 10,
    TAB_SIZE = 3,
    DELIM = ' |',
    COL_DELIM = '-|';

/**
 * a `Report` implementation that produces text output in a detailed table.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('text');
 *
 * @class TextReport
 * @extends Report
 * @module report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the text coverage report will be written, when writing to a file
 * @param {String} [opts.file] the filename for the report. When omitted, the report is written to console
 * @param {Number} [opts.maxCols] the max column width of the report. By default, the width of the report is adjusted based on the length of the paths
 *              to be reported.
 */
function TextReport(opts) {
    Report.call(this);
    opts = opts || {};
    this.dir = opts.dir || process.cwd();
    this.file = opts.file;
    this.summary = opts.summary;
    this.maxCols = opts.maxCols || 0;
    this.watermarks = opts.watermarks || defaults.watermarks();
}

TextReport.TYPE = 'text';
util.inherits(TextReport, Report);

function padding(num, ch) {
    var str = '',
        i;
    ch = ch || ' ';
    for (i = 0; i < num; i += 1) {
        str += ch;
    }
    return str;
}

function fill(str, width, right, tabs, clazz) {
    tabs = tabs || 0;
    str = String(str);

    var leadingSpaces = tabs * TAB_SIZE,
        remaining = width - leadingSpaces,
        leader = padding(leadingSpaces),
        fmtStr = '',
        fillStr,
        strlen = str.length;

    if (remaining > 0) {
        if (remaining >= strlen) {
            fillStr = padding(remaining - strlen);
            fmtStr = right ? fillStr + str : str + fillStr;
        } else {
            fmtStr = str.substring(strlen - remaining);
            fmtStr = '... ' + fmtStr.substring(4);
        }
    }

    fmtStr = defaults.colorize(fmtStr, clazz);
    return leader + fmtStr;
}

function formatName(name, maxCols, level, clazz) {
    return fill(name, maxCols, false, level, clazz);
}

function formatPct(pct, clazz) {
    return fill(pct, PCT_COLS, true, 0, clazz);
}

function nodeName(node) {
    return node.displayShortName() || 'All files';
}


function tableHeader(maxNameCols) {
    var elements = [];
    elements.push(formatName('File', maxNameCols, 0));
    elements.push(formatPct('% Stmts'));
    elements.push(formatPct('% Branches'));
    elements.push(formatPct('% Funcs'));
    elements.push(formatPct('% Lines'));
    return elements.join(' |') + ' |';
}

function tableRow(node, maxNameCols, level, watermarks) {
    var name = nodeName(node),
        statements = node.metrics.statements.pct,
        branches = node.metrics.branches.pct,
        functions = node.metrics.functions.pct,
        lines = node.metrics.lines.pct,
        elements = [];

    elements.push(formatName(name, maxNameCols, level, defaults.classFor('statements', node.metrics, watermarks)));
    elements.push(formatPct(statements, defaults.classFor('statements', node.metrics, watermarks)));
    elements.push(formatPct(branches, defaults.classFor('branches', node.metrics, watermarks)));
    elements.push(formatPct(functions, defaults.classFor('functions', node.metrics, watermarks)));
    elements.push(formatPct(lines, defaults.classFor('lines', node.metrics, watermarks)));

    return elements.join(DELIM) + DELIM;
}

function findNameWidth(node, level, last) {
    last = last || 0;
    level = level || 0;
    var idealWidth = TAB_SIZE * level + nodeName(node).length;
    if (idealWidth > last) {
        last = idealWidth;
    }
    node.children.forEach(function (child) {
        last = findNameWidth(child, level + 1, last);
    });
    return last;
}

function makeLine(nameWidth) {
    var name = padding(nameWidth, '-'),
        pct = padding(PCT_COLS, '-'),
        elements = [];

    elements.push(name);
    elements.push(pct);
    elements.push(pct);
    elements.push(pct);
    elements.push(pct);
    return elements.join(COL_DELIM) + COL_DELIM;
}

function walk(node, nameWidth, array, level, watermarks) {
    var line;
    if (level === 0) {
        line = makeLine(nameWidth);
        array.push(line);
        array.push(tableHeader(nameWidth));
        array.push(line);
    } else {
        array.push(tableRow(node, nameWidth, level, watermarks));
    }
    node.children.forEach(function (child) {
        walk(child, nameWidth, array, level + 1, watermarks);
    });
    if (level === 0) {
        array.push(line);
        array.push(tableRow(node, nameWidth, level, watermarks));
        array.push(line);
    }
}

Report.mix(TextReport, {
    synopsis: function () {
        return 'text report that prints a coverage line for every file, typically to console';
    },
    getDefaultConfig: function () {
        return { file: null, maxCols: 0 };
    },
    writeReport: function (collector /*, sync */) {
        var summarizer = new TreeSummarizer(),
            tree,
            root,
            nameWidth,
            statsWidth = 4 * ( PCT_COLS + 2),
            maxRemaining,
            strings = [],
            text;

        collector.files().forEach(function (key) {
            summarizer.addFileCoverageSummary(key, utils.summarizeFileCoverage(collector.fileCoverageFor(key)));
        });
        tree = summarizer.getTreeSummary();
        root = tree.root;
        nameWidth = findNameWidth(root);
        if (this.maxCols > 0) {
            maxRemaining = this.maxCols - statsWidth - 2;
            if (nameWidth > maxRemaining) {
                nameWidth = maxRemaining;
            }
        }
        walk(root, nameWidth, strings, 0, this.watermarks);
        text = strings.join('\n') + '\n';
        if (this.file) {
            mkdirp.sync(this.dir);
            fs.writeFileSync(path.join(this.dir, this.file), text, 'utf8');
        } else {
            console.log(text);
        }
        this.emit('done');
    }
});

module.exports = TextReport;
