var fs = require('fs');
module.exports = function(licenseFile, outputFile) {
  var licenseText = fs.readFileSync(licenseFile);
  var license = "/**\n @license\n" + licenseText + "\n */\n";
  if (outputFile) {
    outputFile = licenseFile + '.wrapped';
    fs.writeFileSync(outputFile, license, 'utf8');
    return outputFile;
  } else {
    return license;
  }
};
