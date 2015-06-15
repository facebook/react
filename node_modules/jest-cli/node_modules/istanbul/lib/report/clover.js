var path = require('path'),
    util = require('util'),
    Report = require('./index'),
    FileWriter = require('../util/file-writer'),
    TreeSummarizer = require('../util/tree-summarizer'),
    utils = require('../object-utils');

/**
 * a `Report` implementation that produces a clover-style XML file.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('clover');
 *
 * @class CloverReport
 * @module report
 * @extends Report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the clover.xml will be written
 * @param {String} [opts.file] the file name, defaulted to config attribute or 'clover.xml'
 */
function CloverReport(opts) {
    Report.call(this);
    opts = opts || {};
    this.projectRoot = process.cwd();
    this.dir = opts.dir || this.projectRoot;
    this.file = opts.file || this.getDefaultConfig().file;
    this.opts = opts;
}

CloverReport.TYPE = 'clover';
util.inherits(CloverReport, Report);

function asJavaPackage(node) {
    return node.displayShortName().
        replace(/\//g, '.').
        replace(/\\/g, '.').
        replace(/\.$/, '');
}

function asClassName(node) {
    /*jslint regexp: true */
    return node.fullPath().replace(/.*[\\\/]/, '');
}

function quote(thing) {
    return '"' + thing + '"';
}

function attr(n, v) {
    return ' ' + n + '=' + quote(v) + ' ';
}

function branchCoverageByLine(fileCoverage) {
    var branchMap = fileCoverage.branchMap,
        branches = fileCoverage.b,
        ret = {};
    Object.keys(branchMap).forEach(function (k) {
        var line = branchMap[k].line,
            branchData = branches[k];
        ret[line] = ret[line] || [];
        ret[line].push.apply(ret[line], branchData);
    });
    Object.keys(ret).forEach(function (k) {
        var dataArray = ret[k],
            covered = dataArray.filter(function (item) { return item > 0; }),
            coverage = covered.length / dataArray.length * 100;
        ret[k] = { covered: covered.length, total: dataArray.length, coverage: coverage };
    });
    return ret;
}

function addClassStats(node, fileCoverage, writer) {
    fileCoverage = utils.incrementIgnoredTotals(fileCoverage);

    var metrics = node.metrics,
        branchByLine = branchCoverageByLine(fileCoverage),
        fnMap,
        lines;

    writer.println('\t\t\t<file' +
        attr('name', asClassName(node)) +
        attr('path', node.fullPath()) +
        '>');

    writer.println('\t\t\t\t<metrics' +
        attr('statements', metrics.lines.total) +
        attr('coveredstatements', metrics.lines.covered) +
        attr('conditionals', metrics.branches.total) +
        attr('coveredconditionals', metrics.branches.covered) +
        attr('methods', metrics.functions.total) +
        attr('coveredmethods', metrics.functions.covered) +
        '/>');

    fnMap = fileCoverage.fnMap;
    lines = fileCoverage.l;
    Object.keys(lines).forEach(function (k) {
        var str = '\t\t\t\t<line' +
            attr('num', k) +
            attr('count', lines[k]),
            branchDetail = branchByLine[k];

        if (!branchDetail) {
            str += ' type="stmt" ';
        } else {
                str += ' type="cond" ' +
                attr('truecount', branchDetail.covered) +
                attr('falsecount', (branchDetail.total - branchDetail.covered));
        }
        writer.println(str + '/>');
    });

    writer.println('\t\t\t</file>');
}

function walk(node, collector, writer, level, projectRoot) {
    var metrics,
        totalFiles = 0,
        totalPackages = 0,
        totalLines = 0,
        tempLines = 0;
    if (level === 0) {
        metrics = node.metrics;
        writer.println('<?xml version="1.0" encoding="UTF-8"?>');
        writer.println('<coverage' +
            attr('generated', Date.now()) +
            'clover="3.2.0">');

        writer.println('\t<project' +
            attr('timestamp', Date.now()) +
            attr('name', 'All Files') +
            '>');

        node.children.filter(function (child) { return child.kind === 'dir'; }).
            forEach(function (child) {
                totalPackages += 1;
                child.children.filter(function (child) { return child.kind !== 'dir'; }).
                    forEach(function (child) {
                        Object.keys(collector.fileCoverageFor(child.fullPath()).l).forEach(function (k){
                            tempLines = k;
                        });
                        totalLines += Number(tempLines);
                        totalFiles += 1;
                });
        });

        writer.println('\t\t<metrics' +
            attr('statements', metrics.lines.total) +
            attr('coveredstatements', metrics.lines.covered) +
            attr('conditionals', metrics.branches.total) +
            attr('coveredconditionals', metrics.branches.covered) +
            attr('methods', metrics.functions.total) +
            attr('coveredmethods', metrics.functions.covered) +
            attr('elements', metrics.lines.total + metrics.branches.total + metrics.functions.total) +
            attr('coveredelements', metrics.lines.covered + metrics.branches.covered + metrics.functions.covered) +
            attr('complexity', 0) +
            attr('packages', totalPackages) +
            attr('files', totalFiles) +
            attr('classes', totalFiles) +
            attr('loc', totalLines) +
            attr('ncloc', totalLines) +
            '/>');
    }
    if (node.packageMetrics) {
        metrics = node.packageMetrics;
        writer.println('\t\t<package' +
            attr('name', asJavaPackage(node)) +
            '>');

        writer.println('\t\t\t<metrics' +
            attr('statements', metrics.lines.total) +
            attr('coveredstatements', metrics.lines.covered) +
            attr('conditionals', metrics.branches.total) +
            attr('coveredconditionals', metrics.branches.covered) +
            attr('methods', metrics.functions.total) +
            attr('coveredmethods', metrics.functions.covered) +
            '/>');

        node.children.filter(function (child) { return child.kind !== 'dir'; }).
            forEach(function (child) {
                addClassStats(child, collector.fileCoverageFor(child.fullPath()), writer);
            });
        writer.println('\t\t</package>');
    }
    node.children.filter(function (child) { return child.kind === 'dir'; }).
        forEach(function (child) {
            walk(child, collector, writer, level + 1, projectRoot);
        });

    if (level === 0) {
        writer.println('\t</project>');
        writer.println('</coverage>');
    }
}

Report.mix(CloverReport, {
    synopsis: function () {
        return 'XML coverage report that can be consumed by the clover tool';
    },
    getDefaultConfig: function () {
        return { file: 'clover.xml' };
    },
    writeReport: function (collector, sync) {
        var summarizer = new TreeSummarizer(),
            outputFile = path.join(this.dir, this.file),
            writer = this.opts.writer || new FileWriter(sync),
            projectRoot = this.projectRoot,
            that = this,
            tree,
            root;

        collector.files().forEach(function (key) {
            summarizer.addFileCoverageSummary(key, utils.summarizeFileCoverage(collector.fileCoverageFor(key)));
        });
        tree = summarizer.getTreeSummary();
        root = tree.root;
        writer.on('done', function () { that.emit('done'); });
        writer.writeFile(outputFile, function (contentWriter) {
            walk(root, collector, contentWriter, 0, projectRoot);
            writer.done();
        });
    }
});

module.exports = CloverReport;
