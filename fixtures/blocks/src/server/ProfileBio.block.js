/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable import/first */

import * as React from 'react';
import {unstable_block as block} from 'react';

// Server

import {fetch} from 'react-data/fetch';

function load({userId}) {
  const user = fetch(`/users/${userId}`).json();
  return {
    name: user.name,
    bio: fetch(`/bios/${user.bioId}`).json().text,
  };
}

// Client

function ProfileBio(props, data) {
  return (
    <>
      <h3>{data.name}'s Bio</h3>
      <p>{data.bio}</p>
    </>
  );
}

export default block(ProfileBio, load);
