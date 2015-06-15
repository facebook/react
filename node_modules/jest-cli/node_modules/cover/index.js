var instrument     = require('./instrument')
var Module         = require('module').Module;
var path           = require('path');
var fs             = require('fs');
var vm             = require('vm');
var _              = require('underscore');

// Coverage tracker
function CoverageData (filename, instrumentor) {
    this.instrumentor = instrumentor;
    this.filename = filename;
    this.nodes = {};
    this.visitedBlocks = {};
    this.source = instrumentor.source;
};

// Note that a node has been visited
CoverageData.prototype.visit = function(node) {
    var node = this.nodes[node.id] = (this.nodes[node.id] || {node:node, count:0})
    node.count++;
};

// Note that a node has been visited
CoverageData.prototype.visitBlock = function(blockIndex) {
    var block = this.visitedBlocks[blockIndex] = (this.visitedBlocks[blockIndex] || {count:0})
    block.count++;
};

// Get all the nodes we did not see
CoverageData.prototype.missing = function() {
    // Find all the nodes which we haven't seen
    var nodes = this.nodes;
    var missing = this.instrumentor.filter(function(node) {
        return !nodes[node.id];
    });

    return missing;
};

// Get all the nodes we did see
CoverageData.prototype.seen = function() {  
    // Find all the nodes we have seen
    var nodes = this.nodes;
    var seen = this.instrumentor.filter(function(node) {
        return !!nodes[node.id];
    });
    
    return seen;
};

// Calculate node coverage statistics
CoverageData.prototype.blocks = function() {
    var totalBlocks = this.instrumentor.blockCounter;
    var numSeenBlocks = 0;
    for(var index in this.visitedBlocks) {
        numSeenBlocks++;
    }
    var numMissingBlocks = totalBlocks - numSeenBlocks;
    
    var toReturn = {
        total: totalBlocks,
        seen: numSeenBlocks,
        missing: numMissingBlocks,
        percentage: totalBlocks ? numSeenBlocks / totalBlocks : 1
    };
    
    return toReturn;
};

// Explode all multi-line nodes into single-line ones.
var explodeNodes = function(coverageData, fileData) {  
    var missing = coverageData.missing(); 
    var newNodes = [];
    
    // Get only the multi-line nodes.
    var multiLineNodes = missing.filter(function(node) {
        return (node.loc.start.line < node.loc.end.line);
    });
    
    for(var i = 0; i < multiLineNodes.length; i++) {
        // Get the current node and delta
        var node = multiLineNodes[i];
        var lineDelta = node.loc.end.line - node.loc.start.line + 1;
        
        for(var j = 0; j < lineDelta; j++) {
            // For each line in the multi-line node, we'll create a 
            // new node, and we set the start and end columns
            // to the correct vlaues.
            var curLine = node.loc.start.line + j;
            var startCol = 0;
            var endCol = fileData[curLine - 1].length;
                
            if (curLine === node.loc.start.line) {
                startCol = node.loc.start.column;
            }
            else if (curLine === node.loc.end.line) {
                startCol = 0;
                endCol = node.loc.end.column;
            }
            
            var newNode = {
                loc:
                    {
                        start: {
                            line: curLine,
                            col: startCol
                        },
                        end: {
                            line: curLine,
                            col: endCol
                        }
                    }
            };
            
            newNodes.push(newNode);
        }
    }
    
    return newNodes;
}

// Get per-line code coverage information
CoverageData.prototype.coverage = function() {  
    var missingLines = this.missing();
    var fileData = this.instrumentor.source.split('\n');
    
    // Get a dictionary of all the lines we did observe being at least
    // partially covered
    var seen = {};
    
    this.seen().forEach(function(node) {
        seen[node.loc.start.line] = true;
    });
    
    // Add all the new multi-line nodes.
    missingLines = missingLines.concat(explodeNodes(this, fileData));
    
    var seenNodes = {};
    missingLines = missingLines.sort(
        function(lhs, rhs) {
          var lhsNode = lhs.loc;
          var rhsNode = rhs.loc;
          
          // First try to sort based on line
          return lhsNode.start.line < rhsNode.start.line ? -1 : // first try line
                 lhsNode.start.line > rhsNode.start.line ? 1  :
                 lhsNode.start.column < rhsNode.start.column ? -1 : // then try start col
                 lhsNode.start.column > rhsNode.start.column ? 1 :
                 lhsNode.end.column < rhsNode.end.column ? -1 : // then try end col
                 lhsNode.end.column > rhsNode.end.column ? 1 : 
                 0; // then just give up and say they are equal
    }).filter(function(node) {
        // If it is a multi-line node, we can just ignore it
        if (node.loc.start.line < node.loc.end.line) {
            return false;
        }
        
        // We allow multiple nodes per line, but only one node per
        // start column (due to how instrumented works)
        var okay = false;
        if (seenNodes.hasOwnProperty(node.loc.start.line)) {
            var isNew = (seenNodes[node.loc.start.line].indexOf(node.loc.start.column) < 0);
            if (isNew) {
                seenNodes[node.loc.start.line].push(node.loc.start.column);
                okay = true;
            }
        }
        else {
            seenNodes[node.loc.start.line] = [node.loc.start.column];
            okay = true;
        }
        
        return okay;
    });
    
    var coverage = {};
    
    missingLines.forEach(function(node) {
        // For each missing line, add some information for it
        var line = node.loc.start.line;
        var startCol = node.loc.start.column;
        var endCol = node.loc.end.column;
        var source = fileData[line - 1];
        var partial = seen.hasOwnProperty(line) && seen[line];
        
        if (coverage.hasOwnProperty(line)) {
            coverage[line].missing.push({startCol: startCol, endCol: endCol});
        }
        else {
            coverage[line] = {
                  partial: partial,
                  source: source,
                  missing: [{startCol: startCol, endCol: endCol}]
            };
      }
    });
    
    return coverage;
};

CoverageData.prototype.prepare = function() {
    var store = require('./coverage_store').getStore(this.filename);
      
    for(var index in store.nodes) {
        if (store.nodes.hasOwnProperty(index)) {
            this.nodes[index] = {node: this.instrumentor.nodes[index], count: store.nodes[index].count};
        }
    }
    
    for(var index in store.blocks) {
        if (store.blocks.hasOwnProperty(index)) {
            this.visitedBlocks[index] = {count: store.blocks[index].count};
        }
    }
};

// Get statistics for the entire file, including per-line code coverage
// and block-level coverage
CoverageData.prototype.stats = function() {
    this.prepare();
    
    var missing = this.missing();
    var filedata = this.instrumentor.source.split('\n');
    
    var observedMissing = [];
    var linesInfo = missing.sort(function(lhs, rhs) {
        return lhs.loc.start.line < rhs.loc.start.line ? -1 :
               lhs.loc.start.line > rhs.loc.start.line ? 1  :
               0;
        }).filter(function(node) {
            // Make sure we don't double count missing lines due to multi-line
            // issues
            var okay = (observedMissing.indexOf(node.loc.start.line) < 0);
            if(okay) {
              observedMissing.push(node.loc.start.line);
            }
            
            return okay;
        }).map(function(node, idx, all) {
            // For each missing line, add info for it
            return {
                lineno: node.loc.start.line,
                source: function() { return filedata[node.loc.start.line - 1]; }
            };
        });
        
    var numLines = filedata.length;
    var numMissingLines = observedMissing.length;
    var numSeenLines = numLines - numMissingLines;
    var percentageCovered = numSeenLines / numLines;
        
    return {
        percentage: percentageCovered,
        lines: linesInfo,
        missing: numMissingLines,
        seen: numSeenLines,
        total: numLines,
        coverage: this.coverage(),
        source: this.source,
        blocks: this.blocks()
    };
};

// Require the CLI module of cover and return it,
// in case anyone wants to use it programmatically
var cli = function() {
    return require('./bin/cover');
};

var addInstrumentationHeader = function(template, filename, instrumented, coverageStorePath) {
    var template = _.template(template);
    var renderedSource = template({
        instrumented: instrumented,
        coverageStorePath: coverageStorePath,
        filename: filename,
        source: instrumented.instrumentedSource
    });
    
    return renderedSource
};

var stripBOM = function(content) {
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

var load = function(datas) {    
    var combinedCoverage = {};
    
    _.each(datas, function(data) {  
        _.each(data.files, function(fileData, filename) {
            var instrumentor = {
                source: fileData.instrumentor.source,
                nodes: fileData.instrumentor.nodes,
                nodeCounter: fileData.instrumentor.nodeCounter,
                blockCounter: fileData.instrumentor.blockCounter,
            };
            
            var coverage = new CoverageData(filename, new instrument.Instrumentor());
            coverage.instrumentor.source = fileData.instrumentor.source;
            coverage.instrumentor.nodes = fileData.instrumentor.nodes;
            coverage.instrumentor.nodeCounter = fileData.instrumentor.nodeCounter;
            coverage.instrumentor.blockCounter = fileData.instrumentor.blockCounter;
            
            coverage.source = coverage.instrumentor.source;
            coverage.hash = fileData.hash;
            coverage.nodes = fileData.nodes;
            coverage.visitedBlocks = fileData.blocks;
            
            if (combinedCoverage.hasOwnProperty(filename)) {
                var coverageSoFar = combinedCoverage[filename];
                
                if (coverageSoFar.hash !== coverage.hash) {
                    throw new Error("Multiple versions of file '" + filename + "' in coverage data!");
                }
                
                // Merge nodes
                _.each(coverage.nodes, function(nodeData, index) {
                    var nodeDataSoFar = coverageSoFar.nodes[index] = (coverageSoFar.nodes[index] || {node: nodeData.node, count: 0});
                    nodeDataSoFar.count += nodeData.count;
                });
                
                // Merge blocks
                _.each(coverage.visitedBlocks, function(blockData, index) {
                    var blockDataSoFar = coverageSoFar.visitedBlocks[index] = (coverageSoFar.visitedBlocks[index] || {count: 0});
                    blockDataSoFar.count += blockData.count;
                });
            }
            else {
                combinedCoverage[filename] = coverage;
            }
        });
    });
    
    return combinedCoverage;
}

var cover = function(fileRegex, ignore, debugDirectory) {    
    var originalRequire = require.extensions['.js'];
    var coverageData = {};
    var match = null;
    
    ignore = ignore || {};
    
    if (fileRegex instanceof RegExp) {
        match = regex;
    }
    else {
        match = new RegExp(fileRegex ? (fileRegex.replace(/\//g, '\\/').replace(/\./g, '\\.')) : ".*", '');
    }
        
    var pathToCoverageStore = path.resolve(path.resolve(__dirname), "coverage_store.js").replace(/\\/g, "/");
    var templatePath = path.resolve(path.resolve(__dirname), "templates", "instrumentation_header.js");
    var template = fs.readFileSync(templatePath, 'utf-8');
    
    require.extensions['.js'] = function(module, filename) {
        
        filename = filename.replace(/\\/g, "/");

        if(!match.test(filename)) return originalRequire(module, filename);
        if(filename === pathToCoverageStore) return originalRequire(module, filename);
        
        // If the specific file is to be ignored
        var full = path.resolve(filename); 
        if(ignore[full]) {
          return originalRequire(module, filename);
        }
        
        // If any of the parents of the file are to be ignored
        do {
          full = path.dirname(full);
          if (ignore[full]) {
            return originalRequire(module, filename);
          }
        } while(full !== path.dirname(full));

        var data = stripBOM(fs.readFileSync(filename, 'utf8').trim());
        data = data.replace(/^\#\!.*/, '');
        
        var instrumented = instrument(data);
        var coverage = coverageData[filename] = new CoverageData(filename, instrumented);
        
        var newCode = addInstrumentationHeader(template, filename, instrumented, pathToCoverageStore);
        
        if (debugDirectory) {
            var outputPath = path.join(debugDirectory, filename.replace(/[\/|\:|\\]/g, "_") + ".js");
            fs.writeFileSync(outputPath, newCode);
        }
        
        return module._compile(newCode, filename);
    };
    
    // Setup the data retrieval and release functions
    var coverage = function(ready) {
      ready(coverageData);
    };
    
    coverage.release = function() {
      require.extensions['.js'] = originalRequire;
    };
    
    return coverage;
};

module.exports = {
    cover: cover,
    cli: cli,
    load: load,
    hook: function() {
        var c = cli();
        c.hook.apply(c, arguments);  
    },
    combine: function() {
        var c = cli();
        c.combine.apply(c, arguments);  
    },
    hookAndReport: function() {
        var c = cli();
        c.hookAndReport.apply(c, arguments);  
    },
    hookAndCombine: function() {
        var c = cli();
        c.hookAndCombine.apply(c, arguments);  
    },
    hookAndCombineAndReport: function() {
        var c = cli();
        c.hookAndCombineAndReport.apply(c, arguments);  
    },
    reporters: {
        html:   require('./reporters/html'),
        plain:  require('./reporters/plain'),
        cli:    require('./reporters/cli'),
        json:   require('./reporters/json')
    }
};