/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

import React from 'react';
import {colors, media} from 'theme';
import MetaTitle from '../MetaTitle';
import ChevronSvg from '../ChevronSvg';

// TODO Update isActive link as document scrolls past anchor tags
// Maybe used 'hashchange' along with 'scroll' to set/update active links

const Section = ({
  createLink,
  isActive,
  location,
  onLinkClick,
  onSectionTitleClick,
  section,
}) => (
  <div>
    <MetaTitle
      onClick={onSectionTitleClick}
      cssProps={{
        marginTop: 10,

        [media.greaterThan('small')]: {
          color: isActive ? colors.text : colors.subtle,

          ':hover': {
            color: colors.text,
          },
        },
      }}>
      {section.title}
      <ChevronSvg
        cssProps={{
          marginLeft: 7,
          transform: isActive ? 'rotateX(180deg)' : 'rotateX(0deg)',
          transition: 'transform 0.2s ease',

          [media.lessThan('small')]: {
            display: 'none',
          },
        }}
      />
    </MetaTitle>
    <ul
      css={{
        marginBottom: 10,

        [media.greaterThan('small')]: {
          display: isActive ? 'block' : 'none',
        },
      }}>
      {section.items.map(item => (
        <li
          key={item.id}
          css={{
            marginTop: 5,
          }}>
          {createLink({
            item,
            location,
            onLinkClick,
            section,
          })}

          {item.subitems &&
            <ul css={{marginLeft: 20}}>
              {item.subitems.map(subitem => (
                <li key={subitem.id}>
                  {createLink({
                    item: subitem,
                    location,
                    onLinkClick,
                    section,
                  })}
                </li>
              ))}
            </ul>}
        </li>
      ))}
    </ul>
  </div>
);

export default Section;
