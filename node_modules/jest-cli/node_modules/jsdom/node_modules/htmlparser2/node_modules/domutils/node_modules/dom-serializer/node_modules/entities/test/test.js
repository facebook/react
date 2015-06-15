var assert = require("assert"),
    path = require("path"),
    entities = require("../");

describe("Encode->decode test", function(){
	var testcases = [
		{
			input: "asdf & ÿ ü '",
			xml: "asdf &amp; &#xFF; &#xFC; &apos;",
			html: "asdf &amp; &yuml; &uuml; &apos;"
		}, {
			input: "&#38;",
			xml: "&amp;#38;",
			html: "&amp;&num;38&semi;"
		},
	];
	testcases.forEach(function(tc) {
		var encodedXML = entities.encodeXML(tc.input);
		it("should XML encode " + tc.input, function(){
			assert.equal(encodedXML, tc.xml);
		});
		it("should default to XML encode " + tc.input, function(){
			assert.equal(entities.encode(tc.input), tc.xml);
		});
		it("should XML decode " + encodedXML, function(){
			assert.equal(entities.decodeXML(encodedXML), tc.input);
		});
		it("should default to XML encode " + encodedXML, function(){
			assert.equal(entities.decode(encodedXML), tc.input);
		});
		it("should default strict to XML encode " + encodedXML, function(){
			assert.equal(entities.decodeStrict(encodedXML), tc.input);
		});

		var encodedHTML5 = entities.encodeHTML5(tc.input);
		it("should HTML5 encode " + tc.input, function(){
			assert.equal(encodedHTML5, tc.html);
		});
		it("should HTML5 decode " + encodedHTML5, function(){
			assert.equal(entities.decodeHTML(encodedHTML5), tc.input);
		});
	});

	it("should encode data URIs (issue 16)", function(){
		var data = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAALAAABAAEAAAIBRAA7";
		assert.equal(entities.decode(entities.encode(data)), data);
	});
});

describe("Decode test", function(){
	var testcases = [
		{ input: "&amp;amp;",  output: "&amp;" },
		{ input: "&amp;#38;",  output: "&#38;" },
		{ input: "&amp;#x26;", output: "&#x26;" },
		{ input: "&amp;#X26;", output: "&#X26;" },
		{ input: "&#38;#38;",  output: "&#38;" },
		{ input: "&#x26;#38;", output: "&#38;" },
		{ input: "&#X26;#38;", output: "&#38;" },
		{ input: "&#x3a;",     output: ":" },
		{ input: "&#x3A;",     output: ":" },
		{ input: "&#X3a;",     output: ":" },
		{ input: "&#X3A;",     output: ":" }
	];
	testcases.forEach(function(tc) {
		it("should XML decode " + tc.input, function(){
			assert.equal(entities.decodeXML(tc.input), tc.output);
		});
		it("should HTML4 decode " + tc.input, function(){
			assert.equal(entities.decodeHTML(tc.input), tc.output);
		});
		it("should HTML5 decode " + tc.input, function(){
			assert.equal(entities.decodeHTML(tc.input), tc.output);
		});
	});
});

var levels = ["xml", "entities"];

describe("Documents", function(){
	levels
	.map(function(n){ return path.join("..", "maps", n); })
	.map(require)
	.forEach(function(doc, i){
		describe("Decode", function(){
			it(levels[i], function(){
				Object.keys(doc).forEach(function(e){
					for(var l = i; l < levels.length; l++){
						assert.equal(entities.decode("&" + e + ";", l), doc[e]);
					}
				});
			});
		});

		describe("Decode strict", function(){
			it(levels[i], function(){
				Object.keys(doc).forEach(function(e){
					for(var l = i; l < levels.length; l++){
						assert.equal(entities.decodeStrict("&" + e + ";", l), doc[e]);
					}
				});
			});
		});

		describe("Encode", function(){
			it(levels[i], function(){
				Object.keys(doc).forEach(function(e){
					for(var l = i; l < levels.length; l++){
						assert.equal(entities.decode(entities.encode(doc[e], l), l), doc[e]);
					}
				});
			});
		});
	});

	var legacy = require("../maps/legacy.json");

	describe("Legacy", function(){
		it("should decode", runLegacy);
	});

	function runLegacy(){
		Object.keys(legacy).forEach(function(e){
			assert.equal(entities.decodeHTML("&" + e), legacy[e]);
		});
	}
});

var astral = {
	"1D306": "\uD834\uDF06",
	"1D11E": "\uD834\uDD1E"
};

var astralSpecial = {
	"80":    "\u20AC",
	"110000": "\uFFFD"
};


describe("Astral entities", function(){
	Object.keys(astral).forEach(function(c){
		it("should decode " + astral[c], function(){
			assert.equal(entities.decode("&#x" + c + ";"), astral[c]);
		});

		it("should encode " + astral[c], function(){
			assert.equal(entities.encode(astral[c]), "&#x" + c + ";");
		});

		it("should escape " + astral[c], function(){
			assert.equal(entities.escape(astral[c]), "&#x" + c + ";");
		});
	});

	Object.keys(astralSpecial).forEach(function(c){
		it("special should decode \\u" + c, function(){
			assert.equal(entities.decode("&#x" + c + ";"), astralSpecial[c]);
		});
	});
});

describe("Escape", function(){
	it("should always decode ASCII chars", function(){
		for(var i = 0; i < 0x7F; i++){
			var c = String.fromCharCode(i);
			assert.equal(entities.decodeXML(entities.escape(c)), c);
		}
	});
});
