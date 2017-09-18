/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
*/

'use strict';

import Container from 'components/Container';
import Flex from 'components/Flex';
import MarkdownHeader from 'components/MarkdownHeader';
import NavigationFooter from 'templates/components/NavigationFooter';
import {StickyContainer} from 'react-sticky';
import PropTypes from 'prop-types';
import React from 'react';
import StickyResponsiveSidebar from 'components/StickyResponsiveSidebar';
import TitleAndMetaTags from 'components/TitleAndMetaTags';
import findSectionForPath from 'utils/findSectionForPath';
import toCommaSeparatedList from 'utils/toCommaSeparatedList';
import {colors, media, sharedStyles} from 'theme';
import {urlRoot} from 'constants';

const MarkdownPage = ({
  authors,
  date,
  ogDescription,
  location,
  markdownRemark,
  sectionList,
  titlePostfix = '',
}) => {
  const hasAuthors = authors.length > 0;
  const titlePrefix = markdownRemark.frontmatter.title || '';

  return (
    <Flex
      direction="column"
      grow="1"
      shrink="0"
      halign="stretch"
      css={{
        width: '100%',
        flex: '1 0 auto',
        position: 'relative',
        zIndex: 0,
      }}>
      <TitleAndMetaTags
        title={`${titlePrefix}${titlePostfix}`}
        ogUrl={`${urlRoot}/${markdownRemark.fields.path || ''}`}
        ogDescription={ogDescription}
      />
      <div css={{flex: '1 0 auto'}}>
        <Container>
          <StickyContainer
            css={{
              display: 'flex',
              [media.greaterThan('xlarge')]: {
                maxWidth: 800,
                marginLeft: 'auto',
                marginRight: 'auto',
              },
            }}>
            <Flex type="article" direction="column" grow="1" halign="stretch">
              <MarkdownHeader title={titlePrefix} />

              {(date || hasAuthors) &&
                <div css={{marginTop: 15}}>
                  {date}{' '}
                  {hasAuthors &&
                    <span>
                      by {toCommaSeparatedList(authors, author => (
                        <a
                          css={sharedStyles.link}
                          href={author.frontmatter.url}
                          key={author.frontmatter.name}>
                          {author.frontmatter.name}
                        </a>
                      ))}
                    </span>}
                </div>}

              <div
                css={{
                  marginTop: 40,
                  marginBottom: 120,

                  [media.between('medium', 'large')]: {
                    marginTop: 50,
                  },

                  [media.greaterThan('xlarge')]: {
                    marginTop: 85,
                  },
                }}>
                <div
                  css={[sharedStyles.markdown]}
                  dangerouslySetInnerHTML={{__html: markdownRemark.html}}
                />

                {markdownRemark.fields.path &&
                  <div css={{marginTop: 80}}>
                    <a
                      css={{
                        color: colors.subtle,
                        borderColor: colors.divider,
                        transition: 'all 0.2s ease',
                        transitionPropery: 'color, border-color',
                        whiteSpace: 'nowrap',

                        ':after': {
                          display: 'block',
                          content: '',
                          borderTopWidth: 1,
                          borderTopStyle: 'solid',
                        },

                        ':hover': {
                          color: colors.text,
                          borderColor: colors.text,
                        },
                      }}
                      href={`https://github.com/facebook/react/tree/master/docs/${markdownRemark.fields.path}`}>
                      Edit this page
                    </a>
                  </div>}
              </div>
            </Flex>

            <div
              css={{
                flex: '0 0 200px',
                marginLeft: 'calc(9% + 40px)',
                borderLeft: '1px solid #ececec',
                display: 'flex',
                flexDirection: 'column',

                [media.greaterThan('xlargeSmaller')]: {
                  flex: '0 0 300px',
                },
              }}>
              <StickyResponsiveSidebar
                defaultActiveSection={
                  location != null
                    ? findSectionForPath(location.pathname, sectionList)
                    : null
                }
                location={location}
                sectionList={sectionList}
              />
            </div>
          </StickyContainer>
        </Container>
      </div>

      {/* TODO Read prev/next from index map, not this way */}
      <NavigationFooter
        next={markdownRemark.frontmatter.next}
        prev={markdownRemark.frontmatter.prev}
      />
    </Flex>
  );
};

MarkdownPage.defaultProps = {
  authors: [],
};

// TODO Better types
MarkdownPage.propTypes = {
  authors: PropTypes.array.isRequired,
  date: PropTypes.string,
  location: PropTypes.object.isRequired,
  markdownRemark: PropTypes.object.isRequired,
  sectionList: PropTypes.array.isRequired,
};

export default MarkdownPage;
