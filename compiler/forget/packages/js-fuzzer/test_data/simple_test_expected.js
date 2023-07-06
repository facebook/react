// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Original: simple_test.js
var __v_0 = Math.abs;

var __v_1 = 5,
    __v_2;

var __v_3;

if (__v_1) {
  var __v_4 = 3;

  for (var __v_5 = 0; __v_5 < 4; __v_5++) {
    console.log('Value of v5: ' + __v_5);
  }
}

let __v_6 = 3;

const __v_7 = 5 + __v_6;

__v_1 = {
  ['p' + __v_6]: ''
};
__v_1 = `test\`
value is ${__v_6 + __v_7}` + '\0\400\377';

__v_1 = (__v_21 = 2, {
  v9: __v_22 = eval('v8')
}) => {
  return __v_21 + __v_22 + 4;
};

__v_1 = () => 4 + 5;

__v_1 = __v_23 => {
  return __v_23 + 4;
};

__v_1 = async __v_24 => __v_24 + 4;

__v_25 = [0, 1, 2];
__v_26 = [3, 4, 5];
__v_27 = [...__v_25, ...__v_26];

__v_28 = ([__v_29, __v_30] = [1, 2], {
  v31: __v_31
} = {
  v31: __v_29 + __v_30
}) => __v_29 + __v_30 + __v_31;

__v_42 = 170 % 16 / 16 + 2 ** 32;
__v_33 = 0o1 + 0O1 + 01 + 0b011 + 0B011;

for (var __v_8 of [1, 2, 3]) console.log(__v_8);

function __f_0(__v_34) {}

__f_0();

%OptimizeFunctionOnNextCall(__f_0);

function __f_1() {
  var __v_35 = 5;
  return __v_35 + 6;
}

(async function __f_5() {
  var __v_36 = await 1;

  console.log(__v_36);
})();

function* __f_2(__v_37 = 2, ...__v_38) {
  yield* [1, 2, 3];
}

function* __f_3() {
  (yield 3) + (yield);
}

{
  function __f_6() {}
}
__v_39 = {
  v6: __v_6,
  [__v_6]: 3,

  f7() {},

  get f8() {},

  *f9() {},

  async f10() {}

};
var [__v_9, __v_10, ...__v_11] = [10, 20],
    {
  v27: __v_12,
  v28: __v_13
} = {
  v27: 10,
  v28: 20
};

class __c_0 {
  f11(__v_40) {
    return __v_40 + 1;
  }

  static *f12() {
    yield 'a' + super.f12();
  }

  constructor(__v_41) {
    console.log(new.target.name);
  }

  [0]() {}

}

class __c_1 extends __c_0 {}

do ; while (0);

__v_42 **= 4;

for (const __v_43 = 1; __v_43 < 1;);

for (let __v_44 = 1; __v_44 < 5; __v_44++);

for (var __v_14 = 1; __v_14 < 5; __v_14++);

for (const {
  v35: __v_45 = 0,
  v36: __v_46 = 3
} = {}; __v_46 < 1;);

for (let {
  v37: __v_47 = 0,
  v38: __v_48 = 3
} = {}; __v_48 != 0; __v_48--);

for (var {
  v39: __v_15 = 0,
  v40: __v_16 = 3
} = {}; __v_16 != 0; __v_16--);

for (const __v_49 of [1, 2, 3]);

for (let __v_50 of [1, 2, 3]);

for (var __v_17 of [1, 2, 3]);

for (const __v_51 in [1, 2, 3]);

for (let __v_52 in [1, 2, 3]);

for (var __v_18 in [1, 2, 3]);

label: function __f_4() {}

var __v_19 = function __f_7() {
  __f_7();
};

var __v_20 = class __c_2 {
  constructor() {
    console.log(__c_2.name);
  }

};
