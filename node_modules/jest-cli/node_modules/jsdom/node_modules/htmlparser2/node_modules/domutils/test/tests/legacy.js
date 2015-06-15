var DomUtils = require("../..");
var fixture = require("../fixture");
var assert = require("assert");

// Set up expected structures
var expected = {
	idAsdf: fixture[1],
	tag2: [],
	typeScript: []
};
for (var idx = 0; idx < 20; ++idx) {
	expected.tag2.push(fixture[idx*2 + 1].children[5]);
	expected.typeScript.push(fixture[idx*2 + 1].children[1]);
}

describe("legacy", function() {
	describe("getElements", function() {
		var getElements = DomUtils.getElements;
		it("returns the node with the specified ID", function() {
			assert.deepEqual(
				getElements({ id: "asdf" }, fixture, true, 1),
				[expected.idAsdf]
			);
		});
		it("returns empty array for unknown IDs", function() {
			assert.deepEqual(getElements({ id: "asdfs" }, fixture, true), []);
		});
		it("returns the nodes with the specified tag name", function() {
			assert.deepEqual(
				getElements({ tag_name:"tag2" }, fixture, true),
				expected.tag2
			);
		});
		it("returns empty array for unknown tag names", function() {
			assert.deepEqual(
				getElements({ tag_name : "asdfs" }, fixture, true),
				[]
			);
		});
		it("returns the nodes with the specified tag type", function() {
			assert.deepEqual(
				getElements({ tag_type: "script" }, fixture, true),
				expected.typeScript
			);
		});
		it("returns empty array for unknown tag types", function() {
			assert.deepEqual(
				getElements({ tag_type: "video" }, fixture, true),
				[]
			);
		});
	});

	describe("getElementById", function() {
		var getElementById = DomUtils.getElementById;
		it("returns the specified node", function() {
			assert.equal(
				expected.idAsdf,
				getElementById("asdf", fixture, true)
			);
		});
		it("returns `null` for unknown IDs", function() {
			assert.equal(null, getElementById("asdfs", fixture, true));
		});
	});

	describe("getElementsByTagName", function() {
		var getElementsByTagName = DomUtils.getElementsByTagName;
		it("returns the specified nodes", function() {
			assert.deepEqual(
				getElementsByTagName("tag2", fixture, true),
				expected.tag2
			);
		});
		it("returns empty array for unknown tag names", function() {
			assert.deepEqual(
				getElementsByTagName("tag23", fixture, true),
				[]
			);
		});
	});

	describe("getElementsByTagType", function() {
		var getElementsByTagType = DomUtils.getElementsByTagType;
		it("returns the specified nodes", function() {
			assert.deepEqual(
				getElementsByTagType("script", fixture, true),
				expected.typeScript
			);
		});
		it("returns empty array for unknown tag types", function() {
			assert.deepEqual(
				getElementsByTagType("video", fixture, true),
				[]
			);
		});
	});

	describe("getOuterHTML", function() {
		var getOuterHTML = DomUtils.getOuterHTML;
		it("Correctly renders the outer HTML", function() {
			assert.equal(
				getOuterHTML(fixture[1]),
				"<tag1 id=\"asdf\"> <script>text</script> <!-- comment --> <tag2> text </tag2></tag1>"
			);
		});
	});

	describe("getInnerHTML", function() {
		var getInnerHTML = DomUtils.getInnerHTML;
		it("Correctly renders the inner HTML", function() {
			assert.equal(
				getInnerHTML(fixture[1]),
				" <script>text</script> <!-- comment --> <tag2> text </tag2>"
			);
		});
	});

});
