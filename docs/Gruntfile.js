module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('../package.json')
  });

  /**
   * Write React component to js file
   * @param  {String} liveEditJS
   * @param  {String} componentName
   */
  function writeToLiveSampleJS(liveEditJS, componentName) {
    
    grunt.file.write('js/cookbook/' + componentName + '.js', liveEditJS);
  }

  /**
   * Update HTML file to include an ID and script src link
   */
  function writeToHTML() {
    grunt.file.write('_site/cookbook' + componentName + '.html', liveEditJS);
  }

  function readFromCookbookEntry(abspath, rootdir, subdir, filename) {
      
    var markdown = grunt.file.read(abspath),
        codeSample = /```[\S]+\s*[\s\S]*?```/g,

        // read markdown file for code sample
        matchedJS = markdown.match(codeSample),
        trimmedJS,
        componentName,
        componentNameCamelCase,
        componentNameUpperCase,
        liveEditJS;

        // File has no code sample
        if (matchedJS === null) {
          return;
        };

        matchedJS = matchedJS[0];

        // Remove markdown syntax
        matchedJS = matchedJS.slice(5, -3);

        // remove file extension
        componentName = filename.slice(0, -3);


        componentNameCamelCase = componentName;

        componentNameUpperCase = componentName.toUpperCase().replace("-","_");

        componentNameCamelCase = componentNameCamelCase.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase() });

        // Add code sample to live edit 
        liveEditJS = '/**\n * @jsx React.DOM\n */\n\n var ' + componentNameUpperCase + '_COMPONENT = "' + matchedJS + '";\n React.renderComponent(\n ReactPlayground( {codeText:' + componentNameUpperCase + '_COMPONENT} ),\n document.getElementById("' + componentNameCamelCase + 'Example")\n );'
        console.log(componentName);
        
        writeToLiveSampleJS(liveEditJS, componentName);
  }

  grunt.registerTask('makeLiveSamples', 'Create live edit JS file for code samples in React Cookbook entries', function() {
      var rootdir = 'cookbook/';
      
      // Recurse through cookbook directory
      grunt.file.recurse(rootdir, readFromCookbookEntry);

  });

  // Default task(s).
  grunt.registerTask('default', ['makeLiveSamples']);

};