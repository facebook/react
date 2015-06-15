// Copyright 2011 Itay Neeman
//
// Licensed under the MIT License

(function() {
    var coverageStore = {};     
    
    module.exports = {};
    module.exports.register = function(filename) {
        var store = coverageStore[filename] = coverageStore[filename] || {nodes: {}, blocks: {}};
        
        return store;
    }
    
    module.exports.getStore = function(filename) {
        return coverageStore[filename] || {};
    }
})();