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
import StickySidebar from 'components/StickySidebar';
import findSectionForPath from 'utils/findSectionForPath';
import toCommaSeparatedList from 'utils/toCommaSeparatedList';
import {sharedStyles} from 'theme';

// TODO Use 'react-helmet' to set metadata

const MarkdownPage = ({
  authors,
  date,
  location,
  markdownRemark,
  sectionList,
}) => {
  const hasAuthors = authors.length > 0;

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
      <div css={{flex: '1 0 auto'}}>
        <Container>
          <StickyContainer
            css={{
              display: 'flex',
            }}>
            <Flex type="article" direction="column" grow="1" halign="stretch">
              <MarkdownHeader
                path={markdownRemark.fields.path}
                title={markdownRemark.frontmatter.title}
              />

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
                css={[
                  sharedStyles.markdown,
                  {
                    marginTop: 65,
                    marginBottom: 120,
                  },
                ]}
                dangerouslySetInnerHTML={{__html: markdownRemark.html}}
              />
            </Flex>

            <div
              css={{
                flex: '0 0 200px',
                marginLeft: 'calc(9% + 40px)',
              }}>
              <StickySidebar
                defaultActiveSection={location != null ? findSectionForPath(
                  location.pathname,
                  sectionList,
                ) : null}
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
