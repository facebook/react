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

function load(user) {
  return {
    user,
    bio: fetch(`/bios/${user.bioId}`).json(),
  };
}

// Client

function ProfileBio(props, data) {
  return (
    <>
      <h3>{data.user.name}'s Bio</h3>
      <p>{data.bio.text}</p>
    </>
  );
}

export default block(ProfileBio, load);
