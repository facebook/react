#! /usr/bin/env node
// -*- js -*-

"use strict";

var UglifyJS = require("../tools/node");
var sys = require("util");
var optimist = require("optimist");
var fs = require("fs");
var async = require("async");
var acorn;
var ARGS = optimist
    .usage("$0 input1.js [input2.js ...] [options]\n\
Use a single dash to read input from the standard input.\
\n\n\
NOTE: by default there is no mangling/compression.\n\
Without [options] it will simply parse input files and dump the AST\n\
with whitespace and comments discarded.  To achieve compression and\n\
mangling you need to use `-c` and `-m`.\
")
    .describe("source-map", "Specify an output file where to generate source map.")
    .describe("source-map-root", "The path to the original source to be included in the source map.")
    .describe("source-map-url", "The path to the source map to be added in //# sourceMappingURL.  Defaults to the value passed with --source-map.")
    .describe("in-source-map", "Input source map, useful if you're compressing JS that was generated from some other original code.")
    .describe("screw-ie8", "Pass this flag if you don't care about full compliance with Internet Explorer 6-8 quirks (by default UglifyJS will try to be IE-proof).")
    .describe("expr", "Parse a single expression, rather than a program (for parsing JSON)")
    .describe("p", "Skip prefix for original filenames that appear in source maps. \
For example -p 3 will drop 3 directories from file names and ensure they are relative paths.")
    .describe("o", "Output file (default STDOUT).")
    .describe("b", "Beautify output/specify output options.")
    .describe("m", "Mangle names/pass mangler options.")
    .describe("r", "Reserved names to exclude from mangling.")
    .describe("c", "Enable compressor/pass compressor options. \
Pass options like -c hoist_vars=false,if_return=false. \
Use -c with no argument to use the default compression options.")
    .describe("d", "Global definitions")
    .describe("e", "Embed everything in a big function, with a configurable parameter/argument list.")

    .describe("comments", "Preserve copyright comments in the output. \
By default this works like Google Closure, keeping JSDoc-style comments that contain \"@license\" or \"@preserve\". \
You can optionally pass one of the following arguments to this flag:\n\
- \"all\" to keep all comments\n\
- a valid JS regexp (needs to start with a slash) to keep only comments that match.\n\
\
Note that currently not *all* comments can be kept when compression is on, \
because of dead code removal or cascading statements into sequences.")

    .describe("stats", "Display operations run time on STDERR.")
    .describe("acorn", "Use Acorn for parsing.")
    .describe("spidermonkey", "Assume input files are SpiderMonkey AST format (as JSON).")
    .describe("self", "Build itself (UglifyJS2) as a library (implies --wrap=UglifyJS --export-all)")
    .describe("wrap", "Embed everything in a big function, making the “exports” and “global” variables available. \
You need to pass an argument to this option to specify the name that your module will take when included in, say, a browser.")
    .describe("export-all", "Only used when --wrap, this tells UglifyJS to add code to automatically export all globals.")
    .describe("lint", "Display some scope warnings")
    .describe("v", "Verbose")
    .describe("V", "Print version number and exit.")

    .alias("p", "prefix")
    .alias("o", "output")
    .alias("v", "verbose")
    .alias("b", "beautify")
    .alias("m", "mangle")
    .alias("c", "compress")
    .alias("d", "define")
    .alias("r", "reserved")
    .alias("V", "version")
    .alias("e", "enclose")

    .string("source-map")
    .string("source-map-root")
    .string("source-map-url")
    .string("b")
    .string("m")
    .string("c")
    .string("d")
    .string("e")
    .string("comments")
    .string("wrap")

    .boolean("expr")
    .boolean("screw-ie8")
    .boolean("export-all")
    .boolean("self")
    .boolean("v")
    .boolean("stats")
    .boolean("acorn")
    .boolean("spidermonkey")
    .boolean("lint")
    .boolean("V")

    .wrap(80)

    .argv
;

normalize(ARGS);

if (ARGS.version || ARGS.V) {
    var json = require("../package.json");
    sys.puts(json.name + ' ' + json.version);
    process.exit(0);
}

if (ARGS.ast_help) {
    var desc = UglifyJS.describe_ast();
    sys.puts(typeof desc == "string" ? desc : JSON.stringify(desc, null, 2));
    process.exit(0);
}

if (ARGS.h || ARGS.help) {
    sys.puts(optimist.help());
    process.exit(0);
}

if (ARGS.acorn) {
    acorn = require("acorn");
}

var COMPRESS = getOptions("c", true);
var MANGLE = getOptions("m", true);
var BEAUTIFY = getOptions("b", true);

if (ARGS.d) {
    if (COMPRESS) COMPRESS.global_defs = getOptions("d");
}

if (ARGS.screw_ie8) {
    if (COMPRESS) COMPRESS.screw_ie8 = true;
    if (MANGLE) MANGLE.screw_ie8 = true;
}

if (ARGS.r) {
    if (MANGLE) MANGLE.except = ARGS.r.replace(/^\s+|\s+$/g).split(/\s*,+\s*/);
}

var OUTPUT_OPTIONS = {
    beautify: BEAUTIFY ? true : false
};

if (BEAUTIFY)
    UglifyJS.merge(OUTPUT_OPTIONS, BEAUTIFY);

if (ARGS.comments) {
    if (/^\//.test(ARGS.comments)) {
        OUTPUT_OPTIONS.comments = new Function("return(" + ARGS.comments + ")")();
    } else if (ARGS.comments == "all") {
        OUTPUT_OPTIONS.comments = true;
    } else {
        OUTPUT_OPTIONS.comments = function(node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type == "comment2") {
                // multiline comment
                return /@preserve|@license|@cc_on/i.test(text);
            }
        }
    }
}

var files = ARGS._.slice();

if (ARGS.self) {
    if (files.length > 0) {
        sys.error("WARN: Ignoring input files since --self was passed");
    }
    files = UglifyJS.FILES;
    if (!ARGS.wrap) ARGS.wrap = "UglifyJS";
    ARGS.export_all = true;
}

var ORIG_MAP = ARGS.in_source_map;

if (ORIG_MAP) {
    ORIG_MAP = JSON.parse(fs.readFileSync(ORIG_MAP));
    if (files.length == 0) {
        sys.error("INFO: Using file from the input source map: " + ORIG_MAP.file);
        files = [ ORIG_MAP.file ];
    }
    if (ARGS.source_map_root == null) {
        ARGS.source_map_root = ORIG_MAP.sourceRoot;
    }
}

if (files.length == 0) {
    files = [ "-" ];
}

if (files.indexOf("-") >= 0 && ARGS.source_map) {
    sys.error("ERROR: Source map doesn't work with input from STDIN");
    process.exit(1);
}

if (files.filter(function(el){ return el == "-" }).length > 1) {
    sys.error("ERROR: Can read a single file from STDIN (two or more dashes specified)");
    process.exit(1);
}

var STATS = {};
var OUTPUT_FILE = ARGS.o;
var TOPLEVEL = null;

var SOURCE_MAP = ARGS.source_map ? UglifyJS.SourceMap({
    file: OUTPUT_FILE,
    root: ARGS.source_map_root,
    orig: ORIG_MAP,
}) : null;

OUTPUT_OPTIONS.source_map = SOURCE_MAP;

try {
    var output = UglifyJS.OutputStream(OUTPUT_OPTIONS);
    var compressor = COMPRESS && UglifyJS.Compressor(COMPRESS);
} catch(ex) {
    if (ex instanceof UglifyJS.DefaultsError) {
        sys.error(ex.msg);
        sys.error("Supported options:");
        sys.error(sys.inspect(ex.defs));
        process.exit(1);
    }
}

async.eachLimit(files, 1, function (file, cb) {
    read_whole_file(file, function (err, code) {
        if (err) {
            sys.error("ERROR: can't read file: " + filename);
            process.exit(1);
        }
        if (ARGS.p != null) {
            file = file.replace(/^\/+/, "").split(/\/+/).slice(ARGS.p).join("/");
        }
        time_it("parse", function(){
            if (ARGS.spidermonkey) {
                var program = JSON.parse(code);
                if (!TOPLEVEL) TOPLEVEL = program;
                else TOPLEVEL.body = TOPLEVEL.body.concat(program.body);
            }
            else if (ARGS.acorn) {
                TOPLEVEL = acorn.parse(code, {
                    locations     : true,
                    trackComments : true,
                    sourceFile    : file,
                    program       : TOPLEVEL
                });
            }
            else {
                TOPLEVEL = UglifyJS.parse(code, {
                    filename   : file,
                    toplevel   : TOPLEVEL,
                    expression : ARGS.expr,
                });
            };
        });
        cb();
    });
}, function () {
    if (ARGS.acorn || ARGS.spidermonkey) time_it("convert_ast", function(){
        TOPLEVEL = UglifyJS.AST_Node.from_mozilla_ast(TOPLEVEL);
    });

    if (ARGS.wrap) {
        TOPLEVEL = TOPLEVEL.wrap_commonjs(ARGS.wrap, ARGS.export_all);
    }

    if (ARGS.enclose) {
        var arg_parameter_list = ARGS.enclose;

        if (!(arg_parameter_list instanceof Array)) {
            arg_parameter_list = [arg_parameter_list];
        }

        TOPLEVEL = TOPLEVEL.wrap_enclose(arg_parameter_list);
    }

    var SCOPE_IS_NEEDED = COMPRESS || MANGLE || ARGS.lint;

    if (SCOPE_IS_NEEDED) {
        time_it("scope", function(){
            TOPLEVEL.figure_out_scope({ screw_ie8: ARGS.screw_ie8 });
            if (ARGS.lint) {
                TOPLEVEL.scope_warnings();
            }
        });
    }

    if (COMPRESS) {
        time_it("squeeze", function(){
            TOPLEVEL = TOPLEVEL.transform(compressor);
        });
    }

    if (SCOPE_IS_NEEDED) {
        time_it("scope", function(){
            TOPLEVEL.figure_out_scope({ screw_ie8: ARGS.screw_ie8 });
            if (MANGLE) {
                TOPLEVEL.compute_char_frequency(MANGLE);
            }
        });
    }

    if (MANGLE) time_it("mangle", function(){
        TOPLEVEL.mangle_names(MANGLE);
    });
    time_it("generate", function(){
        TOPLEVEL.print(output);
    });

    output = output.get();

    if (SOURCE_MAP) {
        fs.writeFileSync(ARGS.source_map, SOURCE_MAP, "utf8");
        output += "\n//# sourceMappingURL=" + (ARGS.source_map_url || ARGS.source_map);
    }

    if (OUTPUT_FILE) {
        fs.writeFileSync(OUTPUT_FILE, output, "utf8");
    } else {
        sys.print(output);
        sys.error("\n");
    }

    if (ARGS.stats) {
        sys.error(UglifyJS.string_template("Timing information (compressed {count} files):", {
            count: files.length
        }));
        for (var i in STATS) if (STATS.hasOwnProperty(i)) {
            sys.error(UglifyJS.string_template("- {name}: {time}s", {
                name: i,
                time: (STATS[i] / 1000).toFixed(3)
            }));
        }
    }
});

/* -----[ functions ]----- */

function normalize(o) {
    for (var i in o) if (o.hasOwnProperty(i) && /-/.test(i)) {
        o[i.replace(/-/g, "_")] = o[i];
        delete o[i];
    }
}

function getOptions(x, constants) {
    x = ARGS[x];
    if (!x) return null;
    var ret = {};
    if (x !== true) {
        var ast;
        try {
            ast = UglifyJS.parse(x);
        } catch(ex) {
            if (ex instanceof UglifyJS.JS_Parse_Error) {
                sys.error("Error parsing arguments in: " + x);
                process.exit(1);
            }
        }
        ast.walk(new UglifyJS.TreeWalker(function(node){
            if (node instanceof UglifyJS.AST_Toplevel) return; // descend
            if (node instanceof UglifyJS.AST_SimpleStatement) return; // descend
            if (node instanceof UglifyJS.AST_Seq) return; // descend
            if (node instanceof UglifyJS.AST_Assign) {
                var name = node.left.print_to_string({ beautify: false }).replace(/-/g, "_");
                var value = node.right;
                if (constants)
                    value = new Function("return (" + value.print_to_string() + ")")();
                ret[name] = value;
                return true;    // no descend
            }
            sys.error(node.TYPE)
            sys.error("Error parsing arguments in: " + x);
            process.exit(1);
        }));
    }
    return ret;
}

function read_whole_file(filename, cb) {
    if (filename == "-") {
        var chunks = [];
        process.stdin.setEncoding('utf-8');
        process.stdin.on('data', function (chunk) {
            chunks.push(chunk);
        }).on('end', function () {
            cb(null, chunks.join(""));
        });
        process.openStdin();
    } else {
        fs.readFile(filename, "utf-8", cb);
    }
}

function time_it(name, cont) {
    var t1 = new Date().getTime();
    var ret = cont();
    if (ARGS.stats) {
        var spent = new Date().getTime() - t1;
        if (STATS[name]) STATS[name] += spent;
        else STATS[name] = spent;
    }
    return ret;
}
