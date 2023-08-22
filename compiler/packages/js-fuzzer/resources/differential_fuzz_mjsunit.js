// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Substitute for mjsunit. We reuse prettyPrinted from mjsunit, but only if
// it is loaded. If not, we use this substitute instead.
let prettyPrinted = value => value;
