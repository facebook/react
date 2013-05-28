var slice = Array.prototype.slice;
var argv = slice.call(require("system").args);

// Hard to believe PhantomJS has no equivalent of Node's "path" module.
var fs = require("fs");
var splat = [fs.workingDirectory, argv[0]]
  .join(fs.separator)
  .split(fs.separator);

var harness = splat.pop();
if (harness !== "phantom-harness.js") {
  console.error("wrong harness: " + harness);
  phantom.exit(-1);
}

var cwd = splat.join(fs.separator);
fs.changeWorkingDirectory(cwd);

// Hard to believe PhantomJS has no option parsing module.
var port = 8080;
var debug = false;
var lastArg;
while (argv.length > 0) {
  var arg = argv.pop();
  if (arg === "--port") {
    port = +lastArg;
  } else if (arg === "--debug") {
    debug = true;
  }
  lastArg = arg;
}

var server = require("webserver").create();
server.listen(port, function(req, res) {
  var file = req.url.replace(/^\/+/, "");

  switch (file) {
  case "":
  default:
    file = "index.html";
    break;

  case "react-test.js":
    file = "../build/" + file;
    break;

  case "jasmine.css":
    file = "../vendor/jasmine/" + file;
    break;

  case "jasmine.js":
    file = "../build/" + file;
    break;
  }

  if (/\.css$/i.test(file)) {
    res.setHeader("Content-Type", "text/css");
  } else if (/\.js/i.test(file)) {
    res.setHeader("Content-Type", "text/javascript");
  } else {
    res.setHeader("Content-Type", "text/html");
  }

  res.statusCode = 200;
  res.write(fs.read(file));
  res.close();
});

var url = "http://localhost:" + port;
var green = "\033[32m";
var cyan = "\033[36m";
var reset = "\033[0m";

if (debug) {
  console.log(green);
  console.log("PhantomJS received the " + cyan + "--debug" + green + " option.");
  console.log("Load " + cyan + url + green + " in your browser to execute " +
              "the test suite.");
  console.log("Type " + cyan + "control-C" + green + " to terminate the " +
              "PhantomJS process.");
  console.log(reset);

  // Leave PhantomJS running until killed with control-C...

} else {
  var page = require("webpage").create();
  var timeoutSecs = 60;

  page.onCallback = function(data) {
    switch (data.type) {
    case "console":
      console[data.method].apply(console, data.args);
      break;

    case "exit":
      // PhantomJS crashes sometimes unless we call phantom.exit in its own
      // event loop tick.
      setTimeout(function() {
        phantom.exit(data.code);
      }, 10);
      break;
    }
  };

  page.open(url, function(status) {
    if (status !== "success") {
      console.error("failed to open " + url);
      phantom.exit(-1);
    }

    setTimeout(function() {
      console.error(
        "PhantomJS tests timed out after " +
        timeoutSecs + " seconds.");
      phantom.exit(-1);
    }, timeoutSecs * 1e3);
  });
}
