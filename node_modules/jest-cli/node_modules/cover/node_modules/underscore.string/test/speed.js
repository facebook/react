(function() {

  JSLitmus.test('trimNoNative', function() {
    return _.trim("  foobar  ", " ");
  });

  JSLitmus.test('trim', function() {
    return _.trim("  foobar  ");
  });

  JSLitmus.test('trim object-oriented', function() {
    return _("  foobar  ").trim();
  });

  JSLitmus.test('trim jQuery', function() {
    return jQuery.trim("  foobar  ");
  });

  JSLitmus.test('ltrimp', function() {
    return _.ltrim("  foobar  ", " ");
  });

  JSLitmus.test('rtrimp', function() {
    return _.rtrim("  foobar  ", " ");
  });

  JSLitmus.test('startsWith', function() {
    return _.startsWith("foobar", "foo");
  });

  JSLitmus.test('endsWith', function() {
    return _.endsWith("foobar", "xx");
  });

  JSLitmus.test('chop', function(){
    return _('whitespace').chop(2);
  });

  JSLitmus.test('count', function(){
    return _('Hello worls').count('l');
  });

  JSLitmus.test('insert', function() {
    return _('Hello ').insert(6, 'world');
  });

  JSLitmus.test('splice', function() {
    return _('https://edtsech@bitbucket.org/edtsech/underscore.strings').splice(30, 7, 'epeli');
  });

  JSLitmus.test('succ', function(){
    var let = 'a', alphabet = [];

    for (var i=0; i < 26; i++) {
        alphabet.push(let);
        let = _(let).succ();
    }

    return alphabet;
  });

  JSLitmus.test('titleize', function(){
    return _('the titleize string method').titleize();
  });

  JSLitmus.test('truncate', function(){
    return _('Hello world').truncate(5);
  });

  JSLitmus.test('prune', function(){
    return _('Hello world').prune(5);
  });
  
  JSLitmus.test('isBlank', function(){
    return _('').isBlank();
  });

  JSLitmus.test('escapeHTML', function(){
    _('<div>Blah blah blah</div>').escapeHTML();
  });

  JSLitmus.test('unescapeHTML', function(){
    _('&lt;div&gt;Blah blah blah&lt;/div&gt;').unescapeHTML();
  });

  JSLitmus.test('reverse', function(){
    _('Hello World').reverse();
  });

  JSLitmus.test('pad default', function(){
    _('foo').pad(12);
  });

  JSLitmus.test('pad hash left', function(){
    _('foo').pad(12, '#');
  });

  JSLitmus.test('pad hash right', function(){
    _('foo').pad(12, '#', 'right');
  });

  JSLitmus.test('pad hash both', function(){
    _('foo').pad(12, '#', 'both');
  });

  JSLitmus.test('pad hash both longPad', function(){
    _('foo').pad(12, 'f00f00f00', 'both');
  });

  JSLitmus.test('toNumber', function(){
      _('10.232323').toNumber(2);
  });

  JSLitmus.test('strRight', function(){
    _('aaa_bbb_ccc').strRight('_');
  });

  JSLitmus.test('strRightBack', function(){
    _('aaa_bbb_ccc').strRightBack('_');
  });

  JSLitmus.test('strLeft', function(){
    _('aaa_bbb_ccc').strLeft('_');
  });

  JSLitmus.test('strLeftBack', function(){
    _('aaa_bbb_ccc').strLeftBack('_');
  });
  
  JSLitmus.test('join', function(){
    _('separator').join(1, 2, 3, 4, 5, 6, 7, 8, 'foo', 'bar', 'lol', 'wut');
  });

})();
