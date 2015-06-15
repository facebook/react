var path = require('path');
var colors = require('../contrib/colors')

module.exports.MAX_FILENAME_LENGTH = 60;
module.exports.name = "cli";
module.exports.format = function(coverageData) {    
    var stats = coverageData.stats();
    var filename = path.relative(process.cwd(), coverageData.filename);
    
    if (filename.length > module.exports.MAX_FILENAME_LENGTH) {
        filename = "…" + filename.substr(filename.length - module.exports.MAX_FILENAME_LENGTH + 2);
    }
        
    var blockPercentage = Math.floor(stats.blocks.percentage * 100);
    var linePercentage = Math.floor(stats.percentage * 100);
    
    var blockColor = "____";
    if (blockPercentage >= 75) {
        blockColor = "green";
    }
    else if (blockPercentage >= 50) {
        blockColor = "yellow";
    }
    else {
        blockColor = "red";
    }
    
    var lineColor = "";
    if (linePercentage >= 75) {
        lineColor = "green";
    }
    else if (linePercentage >= 50) {
        lineColor = "yellow";
    }
    else {
        lineColor = "red";
    }
    
    return [
        filename,
        (Math.floor(stats.percentage * 100) + "%")[lineColor], 
        stats.missing, 
        stats.total,
        (Math.floor(stats.blocks.percentage * 100) + "%")[blockColor],
        stats.blocks.missing,
        stats.blocks.total];
}