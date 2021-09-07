/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as parseSourceAndMetadataModule from './parseSourceAndMetadata';

export const parseSourceAndMetadata =
  parseSourceAndMetadataModule.parseSourceAndMetadata;
export const purgeCachedMetadata =
  parseSourceAndMetadataModule.purgeCachedMetadata;
