var makeDom = require("../utils").makeDom;
var helpers = require("../..");
var assert = require("assert");

describe("helpers", function() {
	describe("removeSubsets", function() {
		var removeSubsets = helpers.removeSubsets;
		var dom = makeDom("<div><p><span></span></p><p></p></div>")[0];

		it("removes identical trees", function() {
			var matches = removeSubsets([dom, dom]);
			assert.equal(matches.length, 1);
		});

		it("Removes subsets found first", function() {
			var matches = removeSubsets([dom, dom.children[0].children[0]]);
			assert.equal(matches.length, 1);
		});

		it("Removes subsets found last", function() {
			var matches = removeSubsets([dom.children[0], dom]);
			assert.equal(matches.length, 1);
		});

		it("Does not remove unique trees", function() {
			var matches = removeSubsets([dom.children[0], dom.children[1]]);
			assert.equal(matches.length, 2);
		});
	});

	describe("compareDocumentPosition", function() {
		var compareDocumentPosition = helpers.compareDocumentPosition;
		var markup = "<div><p><span></span></p><a></a></div>";
		var dom = makeDom(markup)[0];
		var p = dom.children[0];
		var span = p.children[0];
		var a = dom.children[1];

		it("reports when the first node occurs before the second indirectly", function() {
			assert.equal(compareDocumentPosition(span, a), 2);
		});

		it("reports when the first node contains the second", function() {
			assert.equal(compareDocumentPosition(p, span), 10);
		});

		it("reports when the first node occurs after the second indirectly", function() {
			assert.equal(compareDocumentPosition(a, span), 4);
		});

		it("reports when the first node is contained by the second", function() {
			assert.equal(compareDocumentPosition(span, p), 20);
		});

		it("reports when the nodes belong to separate documents", function() {
			var other = makeDom(markup)[0].children[0].children[0];

			assert.equal(compareDocumentPosition(span, other), 1);
		});

		it("reports when the nodes are identical", function() {
			assert.equal(compareDocumentPosition(span, span), 0);
		});
	});

	describe("uniqueSort", function() {
		var uniqueSort = helpers.uniqueSort;
		var dom, p, span, a;

		beforeEach(function() {
			dom = makeDom("<div><p><span></span></p><a></a></div>")[0];
			p = dom.children[0];
			span = p.children[0];
			a = dom.children[1];
		});

		it("leaves unique elements untouched", function() {
			assert.deepEqual(uniqueSort([p, a]), [p, a]);
		});

		it("removes duplicate elements", function() {
			assert.deepEqual(uniqueSort([p, a, p]), [p, a]);
		});

		it("sorts nodes in document order", function() {
			assert.deepEqual(uniqueSort([a, dom, span, p]), [dom, p, span, a]);
		});
	});
});
