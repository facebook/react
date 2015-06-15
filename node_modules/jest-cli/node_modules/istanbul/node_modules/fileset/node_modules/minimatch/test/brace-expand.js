var tap = require("tap")
  , minimatch = require("../")

tap.test("brace expansion", function (t) {
  // [ pattern, [expanded] ]
  ; [ [ "a{b,c{d,e},{f,g}h}x{y,z}"
      , [ "abxy"
        , "abxz"
        , "acdxy"
        , "acdxz"
        , "acexy"
        , "acexz"
        , "afhxy"
        , "afhxz"
        , "aghxy"
        , "aghxz" ] ]
    , [ "a{1..5}b"
      , [ "a1b"
        , "a2b"
        , "a3b"
        , "a4b"
        , "a5b" ] ]
    , [ "a{b}c", ["a{b}c"] ]
    , [ "a{00..05}b"
      , ["a00b"
        ,"a01b"
        ,"a02b"
        ,"a03b"
        ,"a04b"
        ,"a05b" ] ]
  ].forEach(function (tc) {
    var p = tc[0]
      , expect = tc[1]
    t.equivalent(minimatch.braceExpand(p), expect, p)
  })
  console.error("ending")
  t.end()
})


