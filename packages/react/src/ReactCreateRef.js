/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {RefObject} from 'shared/ReactTypes';

export function createRef(): RefObject {
	const refObject = {
		contents: null,
	};
	if (__DEV__) {
		Object.seal(refObject);
	}
	return refObject;
}
