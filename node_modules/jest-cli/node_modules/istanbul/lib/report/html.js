/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

/*jshint maxlen: 300 */
var handlebars = require('handlebars'),
    defaults = require('./common/defaults'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    FileWriter = require('../util/file-writer'),
    Report = require('./index'),
    Store = require('../store'),
    InsertionText = require('../util/insertion-text'),
    TreeSummarizer = require('../util/tree-summarizer'),
    utils = require('../object-utils'),
    templateFor = function (name) { return handlebars.compile(fs.readFileSync(path.resolve(__dirname, 'templates', name + '.txt'), 'utf8')); },
    headerTemplate = templateFor('head'),
    footerTemplate = templateFor('foot'),
    pathTemplate = handlebars.compile('<div class="path">{{{html}}}</div>'),
    detailTemplate = handlebars.compile([
        '<tr>',
        '<td class="line-count">{{#show_lines}}{{maxLines}}{{/show_lines}}</td>',
        '<td class="line-coverage">{{#show_line_execution_counts fileCoverage}}{{maxLines}}{{/show_line_execution_counts}}</td>',
        '<td class="text"><pre class="prettyprint lang-js">{{#show_code structured}}{{/show_code}}</pre></td>',
        '</tr>\n'
    ].join('')),
    summaryTableHeader = [
        '<div class="coverage-summary">',
        '<table>',
        '<thead>',
        '<tr>',
        '   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>',
        '   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>',
        '   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>',
        '   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>',
        '   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>',
        '   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>',
        '   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>',
        '   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>',
        '   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>',
        '   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>',
        '</tr>',
        '</thead>',
        '<tbody>'
    ].join('\n'),
    summaryLineTemplate = handlebars.compile([
        '<tr>',
        '<td class="file {{reportClasses.statements}}" data-value="{{file}}"><a href="{{output}}">{{file}}</a></td>',
        '<td data-value="{{metrics.statements.pct}}" class="pic {{reportClasses.statements}}">{{#show_picture}}{{metrics.statements.pct}}{{/show_picture}}</td>',
        '<td data-value="{{metrics.statements.pct}}" class="pct {{reportClasses.statements}}">{{metrics.statements.pct}}%</td>',
        '<td data-value="{{metrics.statements.total}}" class="abs {{reportClasses.statements}}">({{metrics.statements.covered}}&nbsp;/&nbsp;{{metrics.statements.total}})</td>',
        '<td data-value="{{metrics.branches.pct}}" class="pct {{reportClasses.branches}}">{{metrics.branches.pct}}%</td>',
        '<td data-value="{{metrics.branches.total}}" class="abs {{reportClasses.branches}}">({{metrics.branches.covered}}&nbsp;/&nbsp;{{metrics.branches.total}})</td>',
        '<td data-value="{{metrics.functions.pct}}" class="pct {{reportClasses.functions}}">{{metrics.functions.pct}}%</td>',
        '<td data-value="{{metrics.functions.total}}" class="abs {{reportClasses.functions}}">({{metrics.functions.covered}}&nbsp;/&nbsp;{{metrics.functions.total}})</td>',
        '<td data-value="{{metrics.lines.pct}}" class="pct {{reportClasses.lines}}">{{metrics.lines.pct}}%</td>',
        '<td data-value="{{metrics.lines.total}}" class="abs {{reportClasses.lines}}">({{metrics.lines.covered}}&nbsp;/&nbsp;{{metrics.lines.total}})</td>',
        '</tr>\n'
    ].join('\n\t')),
    summaryTableFooter = [
        '</tbody>',
        '</table>',
        '</div>'
    ].join('\n'),
    lt = '\u0001',
    gt = '\u0002',
    RE_LT = /</g,
    RE_GT = />/g,
    RE_AMP = /&/g,
    RE_lt = /\u0001/g,
    RE_gt = /\u0002/g;

handlebars.registerHelper('show_picture', function (opts) {
    var num = Number(opts.fn(this)),
        rest,
        cls = '';
    if (isFinite(num)) {
        if (num === 100) {
            cls = ' cover-full';
        }
        num = Math.floor(num);
        rest = 100 - num;
        return '<span class="cover-fill' + cls + '" style="width: ' + num + 'px;"></span>' +
            '<span class="cover-empty" style="width:' + rest + 'px;"></span>';
    } else {
        return '';
    }
});

handlebars.registerHelper('show_ignores', function (metrics) {
    var statements = metrics.statements.skipped,
        functions = metrics.functions.skipped,
        branches = metrics.branches.skipped,
        result;

    if (statements === 0 && functions === 0 && branches === 0) {
        return '<span class="ignore-none">none</span>';
    }

    result = [];
    if (statements >0) { result.push(statements === 1 ? '1 statement': statements + ' statements'); }
    if (functions >0) { result.push(functions === 1 ? '1 function' : functions + ' functions'); }
    if (branches >0) { result.push(branches === 1 ? '1 branch' : branches + ' branches'); }

    return result.join(', ');
});

handlebars.registerHelper('show_lines', function (opts) {
    var maxLines = Number(opts.fn(this)),
        i,
        array = [];

    for (i = 0; i < maxLines; i += 1) {
        array[i] = i + 1;
    }
    return array.join('\n');
});

handlebars.registerHelper('show_line_execution_counts', function (context, opts) {
    var lines = context.l,
        maxLines = Number(opts.fn(this)),
        i,
        lineNumber,
        array = [],
        covered,
        value = '';

    for (i = 0; i < maxLines; i += 1) {
        lineNumber = i + 1;
        value = '&nbsp;';
        covered = 'neutral';
        if (lines.hasOwnProperty(lineNumber)) {
            if (lines[lineNumber] > 0) {
                covered = 'yes';
                value = lines[lineNumber];
            } else {
                covered = 'no';
            }
        }
        array.push('<span class="cline-any cline-' + covered + '">' + value + '</span>');
    }
    return array.join('\n');
});

function customEscape(text) {
    text = text.toString();
    return text.replace(RE_AMP, '&amp;')
        .replace(RE_LT, '&lt;')
        .replace(RE_GT, '&gt;')
        .replace(RE_lt, '<')
        .replace(RE_gt, '>');
}

handlebars.registerHelper('show_code', function (context /*, opts */) {
    var array = [];

    context.forEach(function (item) {
        array.push(customEscape(item.text) || '&nbsp;');
    });
    return array.join('\n');
});

function title(str) {
    return ' title="' + str + '" ';
}

function annotateLines(fileCoverage, structuredText) {
    var lineStats = fileCoverage.l;
    if (!lineStats) { return; }
    Object.keys(lineStats).forEach(function (lineNumber) {
        var count = lineStats[lineNumber];
        if (structuredText[lineNumber]) {
          structuredText[lineNumber].covered = count > 0 ? 'yes' : 'no';
        }
    });
    structuredText.forEach(function (item) {
        if (item.covered === null) {
            item.covered = 'neutral';
        }
    });
}

function annotateStatements(fileCoverage, structuredText) {
    var statementStats = fileCoverage.s,
        statementMeta = fileCoverage.statementMap;
    Object.keys(statementStats).forEach(function (stName) {
        var count = statementStats[stName],
            meta = statementMeta[stName],
            type = count > 0 ? 'yes' : 'no',
            startCol = meta.start.column,
            endCol = meta.end.column + 1,
            startLine = meta.start.line,
            endLine = meta.end.line,
            openSpan = lt + 'span class="' + (meta.skip ? 'cstat-skip' : 'cstat-no') + '"' + title('statement not covered') + gt,
            closeSpan = lt + '/span' + gt,
            text;

        if (type === 'no') {
            if (endLine !== startLine) {
                endLine = startLine;
                endCol = structuredText[startLine].text.originalLength();
            }
            text = structuredText[startLine].text;
            text.wrap(startCol,
                openSpan,
                startLine === endLine ? endCol : text.originalLength(),
                closeSpan);
        }
    });
}

function annotateFunctions(fileCoverage, structuredText) {

    var fnStats = fileCoverage.f,
        fnMeta = fileCoverage.fnMap;
    if (!fnStats) { return; }
    Object.keys(fnStats).forEach(function (fName) {
        var count = fnStats[fName],
            meta = fnMeta[fName],
            type = count > 0 ? 'yes' : 'no',
            startCol = meta.loc.start.column,
            endCol = meta.loc.end.column + 1,
            startLine = meta.loc.start.line,
            endLine = meta.loc.end.line,
            openSpan = lt + 'span class="' + (meta.skip ? 'fstat-skip' : 'fstat-no') + '"' + title('function not covered') + gt,
            closeSpan = lt + '/span' + gt,
            text;

        if (type === 'no') {
            if (endLine !== startLine) {
                endLine = startLine;
                endCol = structuredText[startLine].text.originalLength();
            }
            text = structuredText[startLine].text;
            text.wrap(startCol,
                openSpan,
                startLine === endLine ? endCol : text.originalLength(),
                closeSpan);
        }
    });
}

function annotateBranches(fileCoverage, structuredText) {
    var branchStats = fileCoverage.b,
        branchMeta = fileCoverage.branchMap;
    if (!branchStats) { return; }

    Object.keys(branchStats).forEach(function (branchName) {
        var branchArray = branchStats[branchName],
            sumCount = branchArray.reduce(function (p, n) { return p + n; }, 0),
            metaArray = branchMeta[branchName].locations,
            i,
            count,
            meta,
            type,
            startCol,
            endCol,
            startLine,
            endLine,
            openSpan,
            closeSpan,
            text;

        if (sumCount > 0) { //only highlight if partial branches are missing
            for (i = 0; i < branchArray.length; i += 1) {
                count = branchArray[i];
                meta = metaArray[i];
                type = count > 0 ? 'yes' : 'no';
                startCol = meta.start.column;
                endCol = meta.end.column + 1;
                startLine = meta.start.line;
                endLine = meta.end.line;
                openSpan = lt + 'span class="branch-' + i + ' ' + (meta.skip ? 'cbranch-skip' : 'cbranch-no') + '"' + title('branch not covered') + gt;
                closeSpan = lt + '/span' + gt;

                if (count === 0) { //skip branches taken
                    if (endLine !== startLine) {
                        endLine = startLine;
                        endCol = structuredText[startLine].text.originalLength();
                    }
                    text = structuredText[startLine].text;
                    if (branchMeta[branchName].type === 'if') { // and 'if' is a special case since the else branch might not be visible, being non-existent
                        text.insertAt(startCol, lt + 'span class="' + (meta.skip ? 'skip-if-branch' : 'missing-if-branch') + '"' +
                            title((i === 0 ? 'if' : 'else') + ' path not taken') + gt +
                            (i === 0 ? 'I' : 'E')  + lt + '/span' + gt, true, false);
                    } else {
                        text.wrap(startCol,
                            openSpan,
                            startLine === endLine ? endCol : text.originalLength(),
                            closeSpan);
                    }
                }
            }
        }
    });
}

function getReportClass(stats, watermark) {
    var coveragePct = stats.pct,
        identity  = 1;
    if (coveragePct * identity === coveragePct) {
        return coveragePct >= watermark[1] ? 'high' : coveragePct >= watermark[0] ? 'medium' : 'low';
    } else {
        return '';
    }
}

function cleanPath(name) {
    var SEP = path.sep || '/';
    return (SEP !== '/') ? name.split(SEP).join('/') : name;
}

function isEmptySourceStore(sourceStore) {
    if (!sourceStore) {
        return true;
    }

    var cache = sourceStore.sourceCache;
    return cache && !Object.keys(cache).length;
}

/**
 * a `Report` implementation that produces HTML coverage reports.
 *
 * Usage
 * -----
 *
 *      var report = require('istanbul').Report.create('html');
 *
 *
 * @class HtmlReport
 * @extends Report
 * @module report
 * @constructor
 * @param {Object} opts optional
 * @param {String} [opts.dir] the directory in which to generate reports. Defaults to `./html-report`
 */
function HtmlReport(opts) {
    Report.call(this);
    this.opts = opts || {};
    this.opts.dir = this.opts.dir || path.resolve(process.cwd(), 'html-report');
    this.opts.sourceStore = isEmptySourceStore(this.opts.sourceStore) ?
        Store.create('fslookup') : this.opts.sourceStore;
    this.opts.linkMapper = this.opts.linkMapper || this.standardLinkMapper();
    this.opts.writer = this.opts.writer || null;
    this.opts.templateData = { datetime: Date() };
    this.opts.watermarks = this.opts.watermarks || defaults.watermarks();
}

HtmlReport.TYPE = 'html';
util.inherits(HtmlReport, Report);

Report.mix(HtmlReport, {

    synopsis: function () {
        return 'Navigable HTML coverage report for every file and directory';
    },

    getPathHtml: function (node, linkMapper) {
        var parent = node.parent,
            nodePath = [],
            linkPath = [],
            i;

        while (parent) {
            nodePath.push(parent);
            parent = parent.parent;
        }

        for (i = 0; i < nodePath.length; i += 1) {
            linkPath.push('<a href="' + linkMapper.ancestor(node, i + 1) + '">' +
                (cleanPath(nodePath[i].relativeName) || 'All files') + '</a>');
        }
        linkPath.reverse();
        return linkPath.length > 0 ? linkPath.join(' &#187; ') + ' &#187; ' +
            cleanPath(node.displayShortName()) : '';
    },

    fillTemplate: function (node, templateData) {
        var opts = this.opts,
            linkMapper = opts.linkMapper;

        templateData.entity = node.name || 'All files';
        templateData.metrics = node.metrics;
        templateData.reportClass = getReportClass(node.metrics.statements, opts.watermarks.statements);
        templateData.pathHtml = pathTemplate({ html: this.getPathHtml(node, linkMapper) });
        templateData.base = {
        	css: linkMapper.asset(node, 'base.css')
        };
        templateData.sorter = {
            js: linkMapper.asset(node, 'sorter.js'),
            image: linkMapper.asset(node, 'sort-arrow-sprite.png')
        };
        templateData.prettify = {
            js: linkMapper.asset(node, 'prettify.js'),
            css: linkMapper.asset(node, 'prettify.css')
        };
    },
    writeDetailPage: function (writer, node, fileCoverage) {
        var opts = this.opts,
            sourceStore = opts.sourceStore,
            templateData = opts.templateData,
            sourceText = fileCoverage.code && Array.isArray(fileCoverage.code) ?
                fileCoverage.code.join('\n') + '\n' : sourceStore.get(fileCoverage.path),
            code = sourceText.split(/(?:\r?\n)|\r/),
            count = 0,
            structured = code.map(function (str) { count += 1; return { line: count, covered: null, text: new InsertionText(str, true) }; }),
            context;

        structured.unshift({ line: 0, covered: null, text: new InsertionText("") });

        this.fillTemplate(node, templateData);
        writer.write(headerTemplate(templateData));
        writer.write('<pre><table class="coverage">\n');

        annotateLines(fileCoverage, structured);
        //note: order is important, since statements typically result in spanning the whole line and doing branches late
        //causes mismatched tags
        annotateBranches(fileCoverage, structured);
        annotateFunctions(fileCoverage, structured);
        annotateStatements(fileCoverage, structured);

        structured.shift();
        context = {
            structured: structured,
            maxLines: structured.length,
            fileCoverage: fileCoverage
        };
        writer.write(detailTemplate(context));
        writer.write('</table></pre>\n');
        writer.write(footerTemplate(templateData));
    },

    writeIndexPage: function (writer, node) {
        var linkMapper = this.opts.linkMapper,
            templateData = this.opts.templateData,
            children = Array.prototype.slice.apply(node.children),
            watermarks = this.opts.watermarks;

        children.sort(function (a, b) {
            return a.name < b.name ? -1 : 1;
        });

        this.fillTemplate(node, templateData);
        writer.write(headerTemplate(templateData));
        writer.write(summaryTableHeader);
        children.forEach(function (child) {
            var metrics = child.metrics,
                reportClasses = {
                    statements: getReportClass(metrics.statements, watermarks.statements),
                    lines: getReportClass(metrics.lines, watermarks.lines),
                    functions: getReportClass(metrics.functions, watermarks.functions),
                    branches: getReportClass(metrics.branches, watermarks.branches)
                },
                data = {
                    metrics: metrics,
                    reportClasses: reportClasses,
                    file: cleanPath(child.displayShortName()),
                    output: linkMapper.fromParent(child)
                };
            writer.write(summaryLineTemplate(data) + '\n');
        });
        writer.write(summaryTableFooter);
        writer.write(footerTemplate(templateData));
    },

    writeFiles: function (writer, node, dir, collector) {
        var that = this,
            indexFile = path.resolve(dir, 'index.html'),
            childFile;
        if (this.opts.verbose) { console.error('Writing ' + indexFile); }
        writer.writeFile(indexFile, function (contentWriter) {
            that.writeIndexPage(contentWriter, node);
        });
        node.children.forEach(function (child) {
            if (child.kind === 'dir') {
                that.writeFiles(writer, child, path.resolve(dir, child.relativeName), collector);
            } else {
                childFile = path.resolve(dir, child.relativeName + '.html');
                if (that.opts.verbose) { console.error('Writing ' + childFile); }
                writer.writeFile(childFile, function (contentWriter) {
                    that.writeDetailPage(contentWriter, child, collector.fileCoverageFor(child.fullPath()));
                });
            }
        });
    },

    standardLinkMapper: function () {
        return {
            fromParent: function (node) {
                var relativeName = cleanPath(node.relativeName);
                
                return node.kind === 'dir' ? relativeName + 'index.html' : relativeName + '.html';
            },
            ancestorHref: function (node, num) {
                var href = '',
                    notDot = function(part) {
                        return part !== '.';
                    },
                    separated,
                    levels,
                    i,
                    j;

                for (i = 0; i < num; i += 1) {
                    separated = cleanPath(node.relativeName).split('/').filter(notDot);
                    levels = separated.length - 1;
                    for (j = 0; j < levels; j += 1) {
                        href += '../';
                    }
                    node = node.parent;
                }
                return href;
            },
            ancestor: function (node, num) {
                return this.ancestorHref(node, num) + 'index.html';
            },
            asset: function (node, name) {
                var i = 0,
                    parent = node.parent;
                while (parent) { i += 1; parent = parent.parent; }
                return this.ancestorHref(node, i) + name;
            }
        };
    },

    writeReport: function (collector, sync) {
        var opts = this.opts,
            dir = opts.dir,
            summarizer = new TreeSummarizer(),
            writer = opts.writer || new FileWriter(sync),
            that = this,
            tree,
            copyAssets = function (subdir) {
                var srcDir = path.resolve(__dirname, '..', 'assets', subdir);
                fs.readdirSync(srcDir).forEach(function (f) {
                    var resolvedSource = path.resolve(srcDir, f),
                        resolvedDestination = path.resolve(dir, f),
                        stat = fs.statSync(resolvedSource);

                    if (stat.isFile()) {
                        if (opts.verbose) {
                            console.log('Write asset: ' + resolvedDestination);
                        }
                        writer.copyFile(resolvedSource, resolvedDestination);
                    }
                });
            };

        collector.files().forEach(function (key) {
            summarizer.addFileCoverageSummary(key, utils.summarizeFileCoverage(collector.fileCoverageFor(key)));
        });
        tree = summarizer.getTreeSummary();
        [ '.', 'vendor'].forEach(function (subdir) {
            copyAssets(subdir);
        });
        writer.on('done', function () { that.emit('done'); });
        //console.log(JSON.stringify(tree.root, undefined, 4));
        this.writeFiles(writer, tree.root, dir, collector);
        writer.done();
    }
});

module.exports = HtmlReport;

