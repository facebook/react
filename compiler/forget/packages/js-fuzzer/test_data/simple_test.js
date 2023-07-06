// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Test comment.
// Flags: --gc-interval = 1
var abs = Math.abs;
var v1 = 5, v2; var v3;
if (v1) {
  var v4 = 3;
  for (var v5 = 0; v5 < 4; v5++) {
    console.log('Value of v5: ' +
                v5);
  }
}
let v6 = 3;
const v7 = 5 + \u{0076}6;
v1 = {['p' + v6]: ''};
v1 = `test\`
value is ${ v6 + v7 }` + '\0\400\377'
v1 = (v8=2, {v9 = eval('v8')},) => { return v8 + v9 + 4; };
v1 = () => 4 + 5;
v1 = v10 => { return v10 + 4; }
v1 = async v11 => v11 + 4;
v12 = [0, 1, 2,];
v13 = [3, 4, 5];
v14 = [...v12, ...v13];
v15 = ([v16, v17] = [1, 2], {v31: v18} = {v31: v16 + v17}) => v16 + v17 + v18;
v16 = 170%16/16 + 2**32;
v17 = 0o1 + 0O1 + 01 + 0b011 + 0B011;
for (var v18 of [1, 2, 3]) console.log(v18);
function f1(v19,) {}
f1();
%OptimizeFunctionOnNextCall(f1);
function f2() {
  var v20 = 5;
  return v20 + 6;
}
(async function f3() {
  var v21 = await 1;
  console.log(v21);
})();
function* f4(v22=2, ...v23) {
  yield* [1, 2, 3];
}
function* f5() { (yield 3) + (yield); }
{ function f6() { } }
v23 = { v6, [v6]: 3, f7() { }, get f8 () { }, *f9 () { }, async f10 () { } }
var [v24, v25, ...v26] = [10, 20], {v27, v28} = {v27: 10, v28: 20};
class c1 {
  f11(v29) {
    return v29 + 1;
  }
  static* f12() {
    yield 'a' + super.f12();
  }
  constructor(v30) {
    console.log(new.target.name);
  }
  [0]() { }
}
class c2 extends c1 { }
do ; while(0);
v16 **= 4;
for (const v32 = 1; v32 < 1;);
for (let v33 = 1; v33 < 5; v33++);
for (var v34 = 1; v34 < 5; v34++);
for (const {v35 = 0, v36 = 3} = {}; v36 < 1;);
for (let {v37 = 0, v38 = 3} = {}; v38 != 0; v38--);
for (var {v39 = 0, v40 = 3} = {}; v40 != 0; v40--);
for (const v41 of [1, 2, 3]);
for (let v42 of [1, 2, 3]);
for (var v43 of [1, 2, 3]);
for (const v44 in [1, 2, 3]);
for (let v45 in [1, 2, 3]);
for (var v46 in [1, 2, 3]);
label: function f13() { }

var a = function b() {
  b();
};

var c = class C {
  constructor() {
    console.log(C.name);
  }
};
