var tape = require('tape')
  , caseless = require('./')
  ;

tape('set get has', function (t) {
  var headers = {}
    , c = caseless(headers)
    ;
  t.plan(17)
  c.set('a-Header', 'asdf')
  t.equal(c.get('a-header'), 'asdf')
  t.equal(c.has('a-header'), 'a-Header')
  t.ok(!c.has('nothing'))
  // old bug where we used the wrong regex
  t.ok(!c.has('a-hea'))
  c.set('a-header', 'fdsa')
  t.equal(c.get('a-header'), 'fdsa')
  t.equal(c.get('a-Header'), 'fdsa')
  c.set('a-HEADER', 'more', false)
  t.equal(c.get('a-header'), 'fdsa,more')

  t.deepEqual(headers, {'a-Header': 'fdsa,more'})
  c.swap('a-HEADER')
  t.deepEqual(headers, {'a-HEADER': 'fdsa,more'})

  c.set('deleteme', 'foobar')
  t.ok(c.has('deleteme'))
  t.ok(c.del('deleteme'))
  t.notOk(c.has('deleteme'))
  t.notOk(c.has('idonotexist'))
  t.ok(c.del('idonotexist'))

  c.set('tva', 'test1')
  c.set('tva-header', 'test2')
  t.equal(c.has('tva'), 'tva')
  t.notOk(c.has('header'))

  t.equal(c.get('tva'), 'test1')

})
