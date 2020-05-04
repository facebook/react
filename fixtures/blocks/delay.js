/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = (req, res, next) => {
  if (req.query.delay) {
    setTimeout(next, Number(req.query.delay));
  } else {
    next();
  }
};
