var helper = require("./test-helper.js");

helper.mochaTest("Events", __dirname, function(test, cb){
	helper.writeToParser(
		helper.getEventCollector(cb),
		test.options.parser,
		test.html
	);
});