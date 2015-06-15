
// Instrumentation Header
{
    var <%= instrumented.names.statement %>, <%= instrumented.names.expression %>, <%= instrumented.names.block %>;
    var store = require('<%= coverageStorePath %>');
    var data = store.register('<%= filename %>');
    var nodes = data.nodes;
    var blocks = data.blocks;
    
    <%= instrumented.names.statement %> = function(i) {
        var node = nodes[i] = (nodes[i] || {index: i, count:0})
        node.count++;
    }; 
    
    <%= instrumented.names.expression %> = function(i) {
        var node = nodes[i] = (nodes[i] || {index: i, count:0})
        node.count++;
    }; 
    
    <%= instrumented.names.block %> = function(i) {
        var block = blocks[i] = (blocks[i] || {index: i, count:0})
        block.count++;
    }; 
};
////////////////////////

// Instrumented Code
<%= source %>