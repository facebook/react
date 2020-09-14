/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import nullthrows from 'nullthrows';
import InvalidProfileError from './InvalidProfileError';

export const readInputData = (file: File): Promise<string> => {
  if (!file.name.endsWith('.json')) {
    throw new InvalidProfileError(
      'Invalid file type. Only JSON performance profiles are supported',
    );
  }

  const fileReader = new FileReader();

  return new Promise((resolve, reject) => {
    fileReader.onload = () => {
      const result = nullthrows(fileReader.result);
      if (typeof result === 'string') {
        resolve(result);
      }
      reject(new InvalidProfileError('Input file was not read as a string'));
    };

    fileReader.onerror = () => reject(fileReader.error);

    fileReader.readAsText(file);
  });
};
