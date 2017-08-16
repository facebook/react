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
import ErrorDecoder from 'components/ErrorDecoder';
import Flex from 'components/Flex';
import hex2rgba from 'hex2rgba';
import MarkdownHeader from 'components/MarkdownHeader';
import React from 'react';
import {StickyContainer} from 'react-sticky';
import StickySidebar from 'components/StickySidebar';
import {colors, sharedStyles} from 'theme';
import findSectionForPath from 'utils/findSectionForPath';

import sectionList from '../../../../docs/_data/nav_docs.yml';

// TODO Load and parse the error code
// Keep an eye on gatsby/issues/33 for supporting URL parameters
const todoLocation = {search: '?invariant=109&args[]=MyComponent&args[]=bar'};

const ErrorPage = ({data, location}) => (
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
    <Container>
      <StickyContainer
        css={{
          display: 'flex',
          overflow: 'auto',
        }}>
        <Flex type="article" direction="column" grow="1" halign="stretch">
          <MarkdownHeader
            path={data.markdownRemark.fields.path}
            title={data.markdownRemark.frontmatter.title}
          />

          <div
            css={{
              marginTop: 65,
              marginBottom: 120,
            }}>
            <div
              css={sharedStyles.markdown}
              dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
            />
            <div
              css={{
                '& p': {
                  marginTop: 30,
                },
                '& code': {
                  display: 'block',
                  marginTop: 30,
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: hex2rgba(colors.error, 0.1),
                  color: colors.error,
                },
              }}>
              <ErrorDecoder location={todoLocation} />
            </div>
          </div>
        </Flex>

        <div
          css={{
            flex: '0 0 200px',
            marginLeft: 'calc(9% + 40px)',
          }}>
          <StickySidebar
            defaultActiveSection={findSectionForPath(
              location.pathname,
              sectionList,
            )}
            location={location}
            sectionList={sectionList}
          />
        </div>
      </StickyContainer>
    </Container>
  </Flex>
);

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query ErrorPageMarkdown($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      fields {
        path
      }
      frontmatter {
        title
      }
    }
  }
`;

export default ErrorPage;
