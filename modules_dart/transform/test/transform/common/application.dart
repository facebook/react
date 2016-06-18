// Copyright (c) 2013, the Dart project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.
library angular2.test.transform;

import 'dart:async';

/// Mocked out version of `bootstrap`, defined in application.dart. Importing
/// the actual file in tests causes issues with resolution due to its
/// transitive dependencies.
Future bootstrap(Type appComponentType,
    [List bindings = null, Function givenBootstrapErrorReporter = null]) {
  return null;
}
