$(document).ready(function() {

  // Include Underscore.string methods to Underscore namespace
  _.mixin(_.str.exports());

  module("String extensions");

  test("Strings: trim", function() {
    equals(_.trim(123), "123", "Non string");
    equals(_(" foo").trim(), "foo");
    equals(_("foo ").trim(), "foo");
    equals(_(" foo ").trim(), "foo");
    equals(_("    foo     ").trim(), "foo");
    equals(_("    foo     ", " ").trim(), "foo", "Manually set whitespace");

    equals(_("ffoo").trim("f"), "oo");
    equals(_("ooff").trim("f"), "oo");
    equals(_("ffooff").trim("f"), "oo");


    equals(_("_-foobar-_").trim("_-"), "foobar");

    equals(_("http://foo/").trim("/"), "http://foo");
    equals(_("c:\\").trim('\\'), "c:");
  });

  test("Strings: ltrim", function() {
    equals(_(" foo").ltrim(), "foo");
    equals(_("    foo").ltrim(), "foo");
    equals(_("foo ").ltrim(), "foo ");
    equals(_(" foo ").ltrim(), "foo ");


    equals(_("ffoo").ltrim("f"), "oo");
    equals(_("ooff").ltrim("f"), "ooff");
    equals(_("ffooff").ltrim("f"), "ooff");

    equals(_("_-foobar-_").ltrim("_-"), "foobar-_");
  });

  test("Strings: rtrim", function() {
    equals(_("http://foo/").rtrim("/"), "http://foo", 'clean trailing slash');
    equals(_(" foo").rtrim(), " foo");
    equals(_("foo ").rtrim(), "foo");
    equals(_("foo     ").rtrim(), "foo");
    equals(_("foo  bar     ").rtrim(), "foo  bar");
    equals(_(" foo ").rtrim(), " foo");

    equals(_("ffoo").rtrim("f"), "ffoo");
    equals(_("ooff").rtrim("f"), "oo");
    equals(_("ffooff").rtrim("f"), "ffoo");

    equals(_("_-foobar-_").rtrim("_-"), "_-foobar");
  });

  test("Strings: capitalize", function() {
    equals(_("fabio").capitalize(), "Fabio", 'First letter is upper case');
    equals(_.capitalize("fabio"), "Fabio", 'First letter is upper case');
    equals(_(123).capitalize(), "123", "Non string");
  });

  test("Strings: join", function() {
    equals(_.join("", "foo", "bar"), "foobar", 'basic join');
    equals(_.join("", 1, "foo", 2), "1foo2", 'join numbers and strings');
    equals(_.join(" ","foo", "bar"), "foo bar", 'join with spaces');
    equals(_.join("1", "2", "2"), "212", 'join number strings');
    equals(_.join(1, 2, 2), "212", 'join numbers');
    equals(_(" ").join("foo", "bar"), "foo bar", 'join object oriented');
  });

  test("Strings: reverse", function() {
    equals(_.str.reverse("foo"), "oof" );
    equals(_.str.reverse("foobar"), "raboof" );
    equals(_.str.reverse("foo bar"), "rab oof" );
    equals(_.str.reverse("saippuakauppias"), "saippuakauppias" );
    equals(_.str.reverse(123), "321", "Non string");
    equals(_.str.reverse(123.45), "54.321", "Non string");
  });

  test("Strings: clean", function() {
    equals(_(" foo    bar   ").clean(), "foo bar");
    equals(_(123).clean(), "123");
  });

  test("Strings: sprintf", function() {
    // Should be very tested function already.  Thanks to
    // http://www.diveintojavascript.com/projects/sprintf-for-javascript
    equals(_.sprintf("Hello %s", "me"), "Hello me", 'basic');
    equals(_("Hello %s").sprintf("me"), "Hello me", 'object');
    equals(_("hello %s").chain().sprintf("me").capitalize().value(), "Hello me", 'Chaining works');
    equals(_.sprintf("%.1f", 1.22222), "1.2", 'round');
    equals(_.sprintf("%.1f", 1.17), "1.2", 'round 2');
    equals(_.sprintf("%(id)d - %(name)s", {id: 824, name: "Hello World"}), "824 - Hello World", 'Named replacements work');
    equals(_.sprintf("%(args[0].id)d - %(args[1].name)s", {args: [{id: 824}, {name: "Hello World"}]}), "824 - Hello World", 'Named replacements with arrays work');
  });


  test("Strings: vsprintf", function() {
    equals(_.vsprintf("Hello %s", ["me"]), "Hello me", 'basic');
    equals(_("Hello %s").vsprintf(["me"]), "Hello me", 'object');
    equals(_("hello %s").chain().vsprintf(["me"]).capitalize().value(), "Hello me", 'Chaining works');
    equals(_.vsprintf("%.1f", [1.22222]), "1.2", 'round');
    equals(_.vsprintf("%.1f", [1.17]), "1.2", 'round 2');
    equals(_.vsprintf("%(id)d - %(name)s", [{id: 824, name: "Hello World"}]), "824 - Hello World", 'Named replacement works');
    equals(_.vsprintf("%(args[0].id)d - %(args[1].name)s", [{args: [{id: 824}, {name: "Hello World"}]}]), "824 - Hello World", 'Named replacement with arrays works');
  });

  test("Strings: startsWith", function() {
    ok(_("foobar").startsWith("foo"), 'foobar starts with foo');
    ok(!_("oobar").startsWith("foo"), 'oobar does not start with foo');
    ok(_(12345).startsWith(123), '12345 starts with 123');
    ok(!_(2345).startsWith(123), '2345 does not start with 123');
  });

  test("Strings: endsWith", function() {
    ok(_("foobar").endsWith("bar"), 'foobar ends with bar');
    ok(_.endsWith("foobar", "bar"), 'foobar ends with bar');
    ok(_.endsWith("00018-0000062.Plone.sdh264.1a7264e6912a91aa4a81b64dc5517df7b8875994.mp4", "mp4"), 'endsWith .mp4');
    ok(!_("fooba").endsWith("bar"), 'fooba does not end with bar');
    ok(_.endsWith(12345, 45), '12345 ends with 45');
    ok(!_.endsWith(12345, 6), '12345 does not end with 6');
  });

  test("Strings: include", function() {
    ok(_.str.include("foobar", "bar"), 'foobar includes bar');
    ok(!_.str.include("foobar", "buzz"), 'foobar does not includes buzz');
    ok(_.str.include(12345, 34), '12345 includes 34');
    ok(!_.str.contains(12345, 6), '12345 does not includes 6');
  });

  test('String: chop', function(){
    ok(_('whitespace').chop(2).length === 5, "output ['wh','it','es','pa','ce']");
    ok(_('whitespace').chop(3).length === 4, "output ['whi','tes','pac','e']");
    ok(_('whitespace').chop()[0].length === 10, "output ['whitespace']");
    ok(_(12345).chop(1).length === 5, "output ['1','2','3','4','5']");
  });

  test('String: count', function(){
    equals(_('Hello world').count('l'), 3);
    equals(_('Hello world').count('Hello'), 1);
    equals(_('Hello world').count('foo'), 0);
    equals(_(12345).count(1), 1);
    equals(_(11345).count(1), 2);
  });

  test('String: insert', function(){
    equals(_('Hello ').insert(6, 'Jessy'), 'Hello Jessy');
    equals(_('Hello ').insert(100, 'Jessy'), 'Hello Jessy');
    equals(_(12345).insert(6, 'Jessy'), '12345Jessy');
  });

  test('String: splice', function(){
    equals(_('https://edtsech@bitbucket.org/edtsech/underscore.strings').splice(30, 7, 'epeli'),
           'https://edtsech@bitbucket.org/epeli/underscore.strings');
    equals(_.splice(12345, 1, 2, 321), '132145', 'Non strings');
  });

  test('String: succ', function(){
    equals(_('a').succ(), 'b');
    equals(_('A').succ(), 'B');
    equals(_('+').succ(), ',');
    equals(_(1).succ(), '2');
  });

  test('String: titleize', function(){
    equals(_('the titleize string method').titleize(), 'The Titleize String Method');
    equals(_('the titleize string  method').titleize(), 'The Titleize String  Method');
    equals(_(123).titleize(), '123');
  });

  test('String: camelize', function(){
    equals(_('the_camelize_string_method').camelize(), 'theCamelizeStringMethod');
    equals(_('-the-camelize-string-method').camelize(), 'TheCamelizeStringMethod');
    equals(_('the camelize string method').camelize(), 'theCamelizeStringMethod');
    equals(_(' the camelize  string method').camelize(), 'theCamelizeStringMethod');
    equals(_('the camelize   string method').camelize(), 'theCamelizeStringMethod');
    equals(_(123).camelize(), '123');
  });

  test('String: underscored', function(){
    equals(_('the-underscored-string-method').underscored(), 'the_underscored_string_method');
    equals(_('theUnderscoredStringMethod').underscored(), 'the_underscored_string_method');
    equals(_('TheUnderscoredStringMethod').underscored(), 'the_underscored_string_method');
    equals(_(' the underscored  string method').underscored(), 'the_underscored_string_method');
    equals(_(123).underscored(), '123');
  });

  test('String: dasherize', function(){
    equals(_('the_dasherize_string_method').dasherize(), 'the-dasherize-string-method');
    equals(_('TheDasherizeStringMethod').dasherize(), '-the-dasherize-string-method');
    equals(_('the dasherize string method').dasherize(), 'the-dasherize-string-method');
    equals(_('the  dasherize string method  ').dasherize(), 'the-dasherize-string-method');
    equals(_(123).dasherize(), '123');
  });

  test('String: humanize', function(){
    equals(_('the_humanize_string_method').humanize(), 'The humanize string method');
    equals(_('ThehumanizeStringMethod').humanize(), 'Thehumanize string method');
    equals(_('the humanize string method').humanize(), 'The humanize string method');
    equals(_('the humanize_id string method_id').humanize(), 'The humanize id string method');
    equals(_('the  humanize string method  ').humanize(), 'The humanize string method');
    equals(_('   capitalize dash-CamelCase_underscore trim  ').humanize(), 'Capitalize dash camel case underscore trim');
    equals(_(123).humanize(), '123');
  });

  test('String: truncate', function(){
    equals(_('Hello world').truncate(6, 'read more'), 'Hello read more');
    equals(_('Hello world').truncate(5), 'Hello...');
    equals(_('Hello').truncate(10), 'Hello');
    equals(_(1234567890).truncate(5), '12345...');
  });

  test('String: prune', function(){
    equals(_('Hello, cruel world').prune(6, ' read more'), 'Hello read more');
    equals(_('Hello, world').prune(5, 'read a lot more'), 'Hello, world');
    equals(_('Hello, world').prune(5), 'Hello...');
    equals(_('Hello, world').prune(8), 'Hello...');
    equals(_('Hello, cruel world').prune(15), 'Hello, cruel...');
    equals(_('Hello world').prune(22), 'Hello world');
  });

  test('String: isBlank', function(){
    ok(_('').isBlank());
    ok(_(' ').isBlank());
    ok(_('\n').isBlank());
    ok(!_('a').isBlank());
    ok(!_('0').isBlank());
    ok(!_(0).isBlank());
  });

  test('String: escapeHTML', function(){
    equals(_('<div>Blah & "blah" & \'blah\'</div>').escapeHTML(),
             '&lt;div&gt;Blah &amp; &quot;blah&quot; &amp; &apos;blah&apos;&lt;/div&gt;');
    equals(_('&lt;').escapeHTML(), '&amp;lt;');
    equals(_(5).escapeHTML(), '5');
    equals(_(undefined).escapeHTML(), '');
  });

  test('String: unescapeHTML', function(){
    equals(_('&lt;div&gt;Blah &amp; &quot;blah&quot; &amp; &apos;blah&apos;&lt;/div&gt;').unescapeHTML(),
             '<div>Blah & "blah" & \'blah\'</div>');
    equals(_('&amp;lt;').unescapeHTML(), '&lt;');
    equals(_(5).unescapeHTML(), '5');
    equals(_(undefined).unescapeHTML(), '');
  });

  test('String: words', function() {
    equals(_("I love you!").words().length, 3);
    equals(_("I_love_you!").words('_').length, 3);
    equals(_("I-love-you!").words(/-/).length, 3);
    equals(_(123).words().length, 1);
  });

  test('String: chars', function() {
    equals(_("Hello").chars().length, 5);
    equals(_(123).chars().length, 3);
  });

  test('String: lines', function() {
    equals(_("Hello\nWorld").lines().length, 2);
    equals(_("Hello World").lines().length, 1);
    equals(_(123).lines().length, 1);
  });

  test('String: pad', function() {
    equals(_("1").pad(8), '       1');
    equals(_(1).pad(8), '       1');
    equals(_("1").pad(8, '0'), '00000001');
    equals(_("1").pad(8, '0', 'left'), '00000001');
    equals(_("1").pad(8, '0', 'right'), '10000000');
    equals(_("1").pad(8, '0', 'both'), '00001000');
    equals(_("foo").pad(8, '0', 'both'), '000foo00');
    equals(_("foo").pad(7, '0', 'both'), '00foo00');
    equals(_("foo").pad(7, '!@$%dofjrofj', 'both'), '!!foo!!');
  });

  test('String: lpad', function() {
    equals(_("1").lpad(8), '       1');
    equals(_(1).lpad(8), '       1');
    equals(_("1").lpad(8, '0'), '00000001');
    equals(_("1").lpad(8, '0', 'left'), '00000001');
  });

  test('String: rpad', function() {
    equals(_("1").rpad(8), '1       ');
    equals(_(1).lpad(8), '       1');
    equals(_("1").rpad(8, '0'), '10000000');
    equals(_("foo").rpad(8, '0'), 'foo00000');
    equals(_("foo").rpad(7, '0'), 'foo0000');
  });

  test('String: lrpad', function() {
    equals(_("1").lrpad(8), '    1   ');
    equals(_(1).lrpad(8), '    1   ');
    equals(_("1").lrpad(8, '0'), '00001000');
    equals(_("foo").lrpad(8, '0'), '000foo00');
    equals(_("foo").lrpad(7, '0'), '00foo00');
    equals(_("foo").lrpad(7, '!@$%dofjrofj'), '!!foo!!');
  });

  test('String: toNumber', function() {
    deepEqual(_("not a number").toNumber(), Number.NaN);
	equals(_(0).toNumber(), 0);
	equals(_("0").toNumber(), 0);
    equals(_("2.345").toNumber(), 2);
    equals(_("2.345").toNumber(NaN), 2);
    equals(_("2.345").toNumber(2), 2.35);
    equals(_("2.344").toNumber(2), 2.34);
    equals(_("2").toNumber(2), 2.00);
    equals(_(2).toNumber(2), 2.00);
	equals(_(-2).toNumber(), -2);
	equals(_("-2").toNumber(), -2);
  });

  test('String: strRight', function() {
    equals(_("This_is_a_test_string").strRight("_"), "is_a_test_string");
    equals(_("This_is_a_test_string").strRight("string"), "");
    equals(_("This_is_a_test_string").strRight(), "This_is_a_test_string");
    equals(_("This_is_a_test_string").strRight(""), "This_is_a_test_string");
    equals(_("This_is_a_test_string").strRight("-"), "This_is_a_test_string");
    equals(_(12345).strRight(2), "345");
  });

  test('String: strRightBack', function() {
    equals(_("This_is_a_test_string").strRightBack("_"), "string");
    equals(_("This_is_a_test_string").strRightBack("string"), "");
    equals(_("This_is_a_test_string").strRightBack(), "This_is_a_test_string");
    equals(_("This_is_a_test_string").strRightBack(""), "This_is_a_test_string");
    equals(_("This_is_a_test_string").strRightBack("-"), "This_is_a_test_string");
    equals(_(12345).strRightBack(2), "345");
  });

  test('String: strLeft', function() {
    equals(_("This_is_a_test_string").strLeft("_"), "This");
    equals(_("This_is_a_test_string").strLeft("This"), "");
    equals(_("This_is_a_test_string").strLeft(), "This_is_a_test_string");
    equals(_("This_is_a_test_string").strLeft(""), "This_is_a_test_string");
    equals(_("This_is_a_test_string").strLeft("-"), "This_is_a_test_string");
    equals(_(123454321).strLeft(3), "12");
  });

  test('String: strLeftBack', function() {
    equals(_("This_is_a_test_string").strLeftBack("_"), "This_is_a_test");
    equals(_("This_is_a_test_string").strLeftBack("This"), "");
    equals(_("This_is_a_test_string").strLeftBack(), "This_is_a_test_string");
    equals(_("This_is_a_test_string").strLeftBack(""), "This_is_a_test_string");
    equals(_("This_is_a_test_string").strLeftBack("-"), "This_is_a_test_string");
    equals(_(123454321).strLeftBack(3), "123454");
  });

  test('Strings: stripTags', function() {
    equals(_('a <a href="#">link</a>').stripTags(), 'a link');
    equals(_('a <a href="#">link</a><script>alert("hello world!")</scr'+'ipt>').stripTags(), 'a linkalert("hello world!")');
    equals(_('<html><body>hello world</body></html>').stripTags(), 'hello world');
    equals(_(123).stripTags(), '123');
  });

});
