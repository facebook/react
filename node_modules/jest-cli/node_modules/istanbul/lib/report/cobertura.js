/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var path = require('path'),
    util = require('util'),
    Report = require('./index'),
    FileWriter = require('../util/file-writer'),
    TreeSummarizer = require('../util/tree-summarizer'),
    utils = require('../object-utils');

/**
 * a `Report` implementation that produces a cobertura-style XML file that conforms to the
 * http://cobertura.sourceforge.net/xml/coverage-04.dtd DTD.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('cobertura');
 *
 * @class CoberturaReport
 * @module report
 * @extends Report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to the cobertura-coverage.xml will be written
 */
function CoberturaReport(opts) {
    Report.call(this);
    opts = opts || {};
    this.projectRoot = process.cwd();
    this.dir = opts.dir || this.projectRoot;
    this.file = opts.file || this.getDefaultConfig().file;
    this.opts = opts;
}

CoberturaReport.TYPE = 'cobertura';
util.inherits(CoberturaReport, Report);

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

function addClassStats(node, fileCoverage, writer, projectRoot) {
    fileCoverage = utils.incrementIgnoredTotals(fileCoverage);

    var metrics = node.metrics,
        branchByLine = branchCoverageByLine(fileCoverage),
        fnMap,
        lines;

    writer.println('\t\t<class' +
        attr('name', asClassName(node)) +
        attr('filename', path.relative(projectRoot, node.fullPath())) +
        attr('line-rate', metrics.lines.pct / 100.0) +
        attr('branch-rate', metrics.branches.pct / 100.0) +
        '>');

    writer.println('\t\t<methods>');
    fnMap = fileCoverage.fnMap;
    Object.keys(fnMap).forEach(function (k) {
        var name = fnMap[k].name,
            hits = fileCoverage.f[k];

        writer.println(
            '\t\t\t<method' +
            attr('name', name) +
            attr('hits', hits) +
            attr('signature', '()V') + //fake out a no-args void return
            '>'
        );

        //Add the function definition line and hits so that jenkins cobertura plugin records method hits
        writer.println(
            '\t\t\t\t<lines>' +
             '<line' +
            attr('number', fnMap[k].line) +
            attr('hits', fileCoverage.f[k]) +
            '/>' +
            '</lines>'
        );

        writer.println('\t\t\t</method>');

    });
    writer.println('\t\t</methods>');

    writer.println('\t\t<lines>');
    lines = fileCoverage.l;
    Object.keys(lines).forEach(function (k) {
        var str = '\t\t\t<line' +
            attr('number', k) +
            attr('hits', lines[k]),
            branchDetail = branchByLine[k];

        if (!branchDetail) {
            str += attr('branch', false);
        } else {
            str += attr('branch', true) +
                attr('condition-coverage', branchDetail.coverage +
                    '% (' + branchDetail.covered + '/' + branchDetail.total + ')');
        }
        writer.println(str + '/>');
    });
    writer.println('\t\t</lines>');

    writer.println('\t\t</class>');
}

function walk(node, collector, writer, level, projectRoot) {
    var metrics;
    if (level === 0) {
        metrics = node.metrics;
        writer.println('<?xml version="1.0" ?>');
        writer.println('<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">');
        writer.println('<coverage' +
            attr('lines-valid', metrics.lines.total) +
            attr('lines-covered', metrics.lines.covered) +
            attr('line-rate', metrics.lines.pct / 100.0) +
            attr('branches-valid', metrics.branches.total) +
            attr('branches-covered', metrics.branches.covered) +
            attr('branch-rate', metrics.branches.pct / 100.0) +
            attr('timestamp', Date.now()) +
            'complexity="0" version="0.1">');
        writer.println('<sources>');
        writer.println('\t<source>' + projectRoot + '</source>');
        writer.println('</sources>');
        writer.println('<packages>');
    }
    if (node.packageMetrics) {
        metrics = node.packageMetrics;
        writer.println('\t<package' +
            attr('name', asJavaPackage(node)) +
            attr('line-rate', metrics.lines.pct / 100.0) +
            attr('branch-rate', metrics.branches.pct / 100.0) +
            '>');
        writer.println('\t<classes>');
        node.children.filter(function (child) { return child.kind !== 'dir'; }).
            forEach(function (child) {
                addClassStats(child, collector.fileCoverageFor(child.fullPath()), writer, projectRoot);
            });
        writer.println('\t</classes>');
        writer.println('\t</package>');
    }
    node.children.filter(function (child) { return child.kind === 'dir'; }).
        forEach(function (child) {
            walk(child, collector, writer, level + 1, projectRoot);
        });

    if (level === 0) {
        writer.println('</packages>');
        writer.println('</coverage>');
    }
}

Report.mix(CoberturaReport, {
    synopsis: function () {
        return 'XML coverage report that can be consumed by the cobertura tool';
    },
    getDefaultConfig: function () {
        return { file: 'cobertura-coverage.xml' };
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

module.exports = CoberturaReport;
