exports.name = "RSS (2.0)";
exports.file = "/RSS_Example.xml";
exports.expected = {
	type: "rss",
	id: "",
	title: "Liftoff News",
	link: "http://liftoff.msfc.nasa.gov/",
	description: "Liftoff to Space Exploration.",
	updated: new Date("Tue, 10 Jun 2003 09:41:01 GMT"),
	author: "editor@example.com",
	items: [{
		id: "http://liftoff.msfc.nasa.gov/2003/06/03.html#item573",
		title: "Star City",
		link: "http://liftoff.msfc.nasa.gov/news/2003/news-starcity.asp",
		description: "How do Americans get ready to work with Russians aboard the International Space Station? They take a crash course in culture, language and protocol at Russia's &lt;a href=\"http://howe.iki.rssi.ru/GCTC/gctc_e.htm\"&gt;Star City&lt;/a&gt;.",
		pubDate: new Date("Tue, 03 Jun 2003 09:39:21 GMT")
	}, {
		id: "http://liftoff.msfc.nasa.gov/2003/05/30.html#item572",
		description: "Sky watchers in Europe, Asia, and parts of Alaska and Canada will experience a &lt;a href=\"http://science.nasa.gov/headlines/y2003/30may_solareclipse.htm\"&gt;partial eclipse of the Sun&lt;/a&gt; on Saturday, May 31st.",
		pubDate: new Date("Fri, 30 May 2003 11:06:42 GMT")
	}, {
		id: "http://liftoff.msfc.nasa.gov/2003/05/27.html#item571",
		title: "The Engine That Does More",
		link: "http://liftoff.msfc.nasa.gov/news/2003/news-VASIMR.asp",
		description: "Before man travels to Mars, NASA hopes to design new engines that will let us fly through the Solar System more quickly.  The proposed VASIMR engine would do that.",
		pubDate: new Date("Tue, 27 May 2003 08:37:32 GMT")
	}, {
		id: "http://liftoff.msfc.nasa.gov/2003/05/20.html#item570",
		title: "Astronauts' Dirty Laundry",
		link: "http://liftoff.msfc.nasa.gov/news/2003/news-laundry.asp",
		description: "Compared to earlier spacecraft, the International Space Station has many luxuries, but laundry facilities are not one of them.  Instead, astronauts have other options.",
		pubDate: new Date("Tue, 20 May 2003 08:56:02 GMT")
	}]
};