#!/usr/bin/env node

var runforcover = require("../../index");
var fs = require('fs');
var path = require('path');

var coverage = runforcover.cover();

var test1 = require("./src/test1");
var test2 = require("./src/test2");

test1.run();
test2.run();

var types = ['html', 'plain', 'json'];
var outDir = 'test-out';
try {
    fs.statSync(outDir);
} catch (e) {
    fs.mkdirSync(outDir, 0755);
}

coverage(function(coverageData) {
    // coverageData is an object keyed by filename.
    for(var filename in coverageData) {
        if (!coverageData.hasOwnProperty(filename)) {
            continue;
        }

        types.forEach(function (type) {

            var result = runforcover.formatters[type].format(coverageData[filename]);
            var filePath = path.join(outDir, path.basename(filename) + "." + type);

            if (type === 'html') {
                result = "<style>" + "\n"
                    + "  .covered { background: #C9F76F; }" + "\n"
                    + "  .uncovered { background: #FDD; }" + "\n"
                    + "  .partialuncovered { background: #FFA; }" + "\n"
                    + "</style>" + "\n"
                    + result;
            }
            fs.writeFileSync(filePath, result);
        });

        // return control back to the original require function
        coverage.release(); 
    }
});
