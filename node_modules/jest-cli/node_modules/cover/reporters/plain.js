function pad(text, width) {
  text = text + '';
  var result = '';
  for (var i = 0; i < width - text.length; i++) {
    result += ' ';
  }
  return result + text;
}

module.exports = {
    name: "plain",
    format: function(coverageData) {
        var source = coverageData.source.split('\n');
        var stats = coverageData.stats();
        var filename = coverageData.filename;
        var result = 'File: ' + filename + '\n\n';

        for(var i = 0 ; i < source.length; i++) {
            var sourceLine = source[i];
            var line = i;
            var lineOutput = [];
            if (!stats.coverage.hasOwnProperty(line + 1)) {
                // ignore covered
            }
            else {
                var lineInfo = stats.coverage[line + 1];
                sourceLine = lineInfo.source;
                
                if (!lineInfo.partial) {
                    // If it isn't partial, then we can just append the entire line
                    result += pad(i + 1, 5) + ' | ' + sourceLine + '\n';
                }
                else {
                    var partialLine = '';
                    for(var j = 0; j < lineInfo.missing.length; j++) {
                        curStart = j == 0 ? 0 : (lineInfo.missing[j-1].endCol + 1);
                        curEnd = lineInfo.missing[j].startCol;
                        partialLine += pad('', curEnd - curStart);
                        partialLine += sourceLine.slice(lineInfo.missing[j].startCol, lineInfo.missing[j].endCol + 1);
                    }

                    result += pad(i + 1, 5) + ' | ' + partialLine + '\n';
                }
            }
        }
        return result + '\n';
    }
}