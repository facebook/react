//Runs tests for feeds

var helper = require("./test-helper.js"),
	FeedHandler = require("..").RssHandler,
	fs = require("fs"),
	path = require("path");

helper.mochaTest("Feeds", __dirname, function(test, cb){
	fs.readFile(
		path.join(__dirname, "Documents", test.file),
		function(err, file){
			helper.writeToParser(
				new FeedHandler(cb),
				{ xmlMode: true },
				file.toString()
			);
		}
	);
});