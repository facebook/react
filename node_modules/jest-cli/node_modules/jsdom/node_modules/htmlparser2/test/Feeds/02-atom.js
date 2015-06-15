exports.name = "Atom (1.0)";
exports.file = "/Atom_Example.xml";
exports.expected = {
	type: "atom",
	id: "urn:uuid:60a76c80-d399-11d9-b91C-0003939e0af6",
	title: "Example Feed",
	link: "http://example.org/feed/",
	description: "A subtitle.",
	updated: new Date("2003-12-13T18:30:02Z"),
	author: "johndoe@example.com",
	items: [{
		id: "urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a",
		title: "Atom-Powered Robots Run Amok",
		link: "http://example.org/2003/12/13/atom03",
		description: "Some content.",
		pubDate: new Date("2003-12-13T18:30:02Z")
	}]
};
