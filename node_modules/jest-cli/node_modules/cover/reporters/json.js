module.exports = {
    name: "json",
    format: function(coverageData) {
        var source = coverageData.source;
        var stats = coverageData.stats();
        var filename = coverageData.filename;
        var result = { filename: filename, stats: stats, source: source };
 
        return result;
    }
}