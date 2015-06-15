# Exports an object that defines
#  all of the configuration needed by the projects'
#  depended-on grunt tasks.
#
# You can familiarize yourself with all of Lineman's defaults by checking out the parent file:
# https://github.com/testdouble/lineman/blob/master/config/application.coffee
#

# lineman-lib-template config options:

includeVendorInDistribution = false #set to true if you want your distribution to contain JS files in vendor/js

lineman = require(process.env["LINEMAN_MAIN"])
grunt = lineman.grunt
_ = grunt.util._
application = lineman.config.extend "application",

  meta:
    banner: """
            /* <%= pkg.name %> - <%= pkg.version %>
             * <%= pkg.description || pkg.description %>
             * <%= pkg.homepage %>
             */

            """

  removeTasks:
    common: ["less", "handlebars", "jst", "images:dev", "webfonts:dev", "pages:dev"]
    dev: ["server"]
    dist: ["cssmin", "images:dist", "webfonts:dist", "pages:dist"]

  concat:
    uncompressedDist:
      options:
        banner: "<%= meta.banner %>"
      src: _([
        ("<%= files.js.vendor %>" if includeVendorInDistribution),
        "<%= files.coffee.generated %>",
        "<%= files.js.app %>"
      ]).compact()
      dest: "<%= files.js.uncompressedDist %>"

application.uglify.js.files = _({}).tap (config) ->
  config["dist/#{grunt.file.readJSON('package.json').name}.min.js"] = "<%= files.js.uncompressedDist %>"

module.exports = application
