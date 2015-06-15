module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    mochaTest: {
      files: ['test/*.js']
    },
    mochaTestConfig: {
      options: {
        reporter: 'spec',
        ui: 'exports'
      }
    },

    jshint: {
      options: {
        "bitwise": false,
        "camelcase": false,
        "curly": false,
        "eqeqeq": true,
        "forin": true,
        "immed": true,
        "indent": 2,
        "latedef": false,
        "newcap": true,
        "noarg": true,
        "noempty": false,
        "nonew": true,
        "plusplus": false,
        "quotmark": false,
        "undef": true,
        "unused": true,
        "strict": true,
        "trailing": true,

        "boss": true,
        "laxcomma": true,
        "multistr": true,
        "sub": true,
        "supernew": true,

        "browser": true,
        "node": true,
		"worker": true,

        "predef": [
            'define', 'require'
        ]
      },
      files: ['levenshtein.js']
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %>. Copyright <%= pkg.author %> */\n'
      },
      build: {
        src: 'levenshtein.js',
        dest: 'levenshtein.min.js'
      }
    },

    benchmarkConfig: {
      speed: {
        src: ['benchmark/speed.js']
      }
    },
  });

  require('load-grunt-tasks')(grunt);
  grunt.renameTask('benchmark', 'benchmarkConfig');

  grunt.registerTask('build', ['jshint', 'uglify', 'mochaTest']);

  grunt.registerTask('default', ['build']);

  grunt.registerTask('benchmark', ['npm-install:levenshtein-edit-distance:levenshtein:natural:levenshtein-component:levenshtein-deltas', 'benchmarkConfig']);
};


