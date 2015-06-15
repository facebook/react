"use strict";

var fs = require('fs'),
    Handlebars = require('./index'),
    basename = require('path').basename,
    SourceMap = require('source-map'),
      SourceMapConsumer = SourceMap.SourceMapConsumer,
      SourceNode = SourceMap.SourceNode,
    uglify = require('uglify-js');

module.exports.cli = function(opts) {
  if (opts.version) {
    console.log(Handlebars.VERSION);
    return;
  }

  if (!opts.templates.length) {
    throw new Handlebars.Exception('Must define at least one template or directory.');
  }

  opts.templates.forEach(function(template) {
    try {
      fs.statSync(template);
    } catch (err) {
      throw new Handlebars.Exception('Unable to open template file "' + template + '"');
    }
  });

  if (opts.simple && opts.min) {
    throw new Handlebars.Exception('Unable to minimize simple output');
  }
  if (opts.simple && (opts.templates.length !== 1 || fs.statSync(opts.templates[0]).isDirectory())) {
    throw new Handlebars.Exception('Unable to output multiple templates in simple mode');
  }

  // Convert the known list into a hash
  var known = {};
  if (opts.known && !Array.isArray(opts.known)) {
    opts.known = [opts.known];
  }
  if (opts.known) {
    for (var i = 0, len = opts.known.length; i < len; i++) {
      known[opts.known[i]] = true;
    }
  }

  // Build file extension pattern
  var extension = opts.extension.replace(/[\\^$*+?.():=!|{}\-\[\]]/g, function(arg) { return '\\' + arg; });
  extension = new RegExp('\\.' + extension + '$');

  var output = new SourceNode();
  if (!opts.simple) {
    if (opts.amd) {
      output.add('define([\'' + opts.handlebarPath + 'handlebars.runtime\'], function(Handlebars) {\n  Handlebars = Handlebars["default"];');
    } else if (opts.commonjs) {
      output.add('var Handlebars = require("' + opts.commonjs + '");');
    } else {
      output.add('(function() {\n');
    }
    output.add('  var template = Handlebars.template, templates = ');
    if (opts.namespace) {
      output.add(opts.namespace);
      output.add(' = ');
      output.add(opts.namespace);
      output.add(' || ');
    }
    output.add('{};\n');
  }
  function processTemplate(template, root) {
    var path = template,
        stat = fs.statSync(path);
    if (stat.isDirectory()) {
      fs.readdirSync(template).map(function(file) {
        var path = template + '/' + file;

        if (extension.test(path) || fs.statSync(path).isDirectory()) {
          processTemplate(path, root || template);
        }
      });
    } else {
      var data = fs.readFileSync(path, 'utf8');

      if (opts.bom && data.indexOf('\uFEFF') === 0) {
        data = data.substring(1);
      }

      var options = {
        knownHelpers: known,
        knownHelpersOnly: opts.o
      };

      if (opts.map) {
        options.srcName = path;
      }
      if (opts.data) {
        options.data = true;
      }

      // Clean the template name
      if (!root) {
        template = basename(template);
      } else if (template.indexOf(root) === 0) {
        template = template.substring(root.length+1);
      }
      template = template.replace(extension, '');

      var precompiled = Handlebars.precompile(data, options);

      // If we are generating a source map, we have to reconstruct the SourceNode object
      if (opts.map) {
        var consumer = new SourceMapConsumer(precompiled.map);
        precompiled = SourceNode.fromStringWithSourceMap(precompiled.code, consumer);
      }

      if (opts.simple) {
        output.add([precompiled, '\n']);
      } else if (opts.partial) {
        if(opts.amd && (opts.templates.length == 1 && !fs.statSync(opts.templates[0]).isDirectory())) {
          output.add('return ');
        }
        output.add(['Handlebars.partials[\'', template, '\'] = template(', precompiled, ');\n']);
      } else {
        if(opts.amd && (opts.templates.length == 1 && !fs.statSync(opts.templates[0]).isDirectory())) {
          output.add('return ');
        }
        output.add(['templates[\'', template, '\'] = template(', precompiled, ');\n']);
      }
    }
  }

  opts.templates.forEach(function(template) {
    processTemplate(template, opts.root);
  });

  // Output the content
  if (!opts.simple) {
    if (opts.amd) {
      if(opts.templates.length > 1 || (opts.templates.length == 1 && fs.statSync(opts.templates[0]).isDirectory())) {
        if(opts.partial){
          output.add('return Handlebars.partials;\n');
        } else {
          output.add('return templates;\n');
        }
      }
      output.add('});');
    } else if (!opts.commonjs) {
      output.add('})();');
    }
  }


  if (opts.map) {
    output.add('\n//# sourceMappingURL=' + opts.map + '\n');
  }

  output = output.toStringWithSourceMap();
  output.map = output.map + '';

  if (opts.min) {
    output = uglify.minify(output.code, {
      fromString: true,

      outSourceMap: opts.map,
      inSourceMap: JSON.parse(output.map)
    });
    if (opts.map) {
      output.code += '\n//# sourceMappingURL=' + opts.map + '\n';
    }
  }

  if (opts.map) {
    fs.writeFileSync(opts.map, output.map, 'utf8');
  }
  output = output.code;

  if (opts.output) {
    fs.writeFileSync(opts.output, output, 'utf8');
  } else {
    console.log(output);
  }
};