/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {fetch} from 'react-fetch';

export default function ProfileBio({userId}) {
  const user = fetch(`/users/${userId}`).json();
  const bio = fetch(`/bios/${user.bioId}`).json().text;
  return (
    <>
      <h3>{user.name}'s Bio</h3>
      <p>{bio}</p>
    </>
  );
}
