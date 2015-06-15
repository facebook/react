var makeDom = require("./utils").makeDom;
var markup = Array(21).join(
	"<?xml><tag1 id='asdf'> <script>text</script> <!-- comment --> <tag2> text </tag1>"
);

module.exports = makeDom(markup);
