var fs = require("fs"),
    path = require("path"),
    assert = require("assert"),
    util = require("util"),
    Parser = require("htmlparser2").Parser,
    Handler = require("../");

var basePath = path.resolve(__dirname, "cases"),
    inspectOpts = { showHidden: true, depth: null };

fs
.readdirSync(basePath)
.filter(RegExp.prototype.test, /\.json$/) //only allow .json files
.map(function(name){
	return path.resolve(basePath, name);
})
.map(require)
.forEach(function(test){
	it(test.name, function(){
		var expected = test.expected;

		var handler = new Handler(function(err, actual){
			assert.ifError(err);
			try {
				compare(expected, actual);
			} catch(e){
				e.expected = util.inspect(expected, inspectOpts);
				e.actual   = util.inspect(actual,   inspectOpts);
				throw e;
			}
		}, test.options);

		var data = test.html;

		var parser = new Parser(handler, test.options);

		//first, try to run the test via chunks
		if (test.streaming || test.streaming === undefined){
			for(var i = 0; i < data.length; i++){
				parser.write(data.charAt(i));
			}
			parser.done();
		}

		//then parse everything
		parser.parseComplete(data);
	});
});

function compare(expected, result){
	assert.equal(typeof expected, typeof result, "types didn't match");
	if(typeof expected !== "object" || expected === null){
		assert.strictEqual(expected, result, "result doesn't equal expected");
	} else {
		for(var prop in expected){
			assert.ok(prop in result, "result didn't contain property " + prop);
			compare(expected[prop], result[prop]);
		}
	}
}