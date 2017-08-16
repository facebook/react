/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
import StickyResponsiveSidebar from 'components/StickyResponsiveSidebar';
import {colors, sharedStyles} from 'theme';
import {createLinkDocs} from 'utils/createLink';
import findSectionForPath from 'utils/findSectionForPath';
import {sectionListDocs} from 'utils/sectionList';

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
      <div css={sharedStyles.articleLayout.container}>

        <Flex
          type="article"
          direction="column"
          grow="1"
          halign="stretch"
          css={{
            minHeight: 'calc(100vh - 40px)',
          }}>
          <MarkdownHeader
            path={data.markdownRemark.fields.path}
            title={data.markdownRemark.frontmatter.title}
          />

          <div css={sharedStyles.articleLayout.content}>
            <div
              css={sharedStyles.markdown}
              dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
            />
            <div
              css={[
                sharedStyles.markdown,
                {
                  marginTop: 30,
                  '& code': {
                    display: 'block',
                    marginTop: 30,
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: hex2rgba(colors.error, 0.1),
                    color: colors.error,
                  },
                },
              ]}>
              <ErrorDecoder location={location} />
            </div>
          </div>
        </Flex>

        <div css={sharedStyles.articleLayout.sidebar}>
          <StickyResponsiveSidebar
            createLink={createLinkDocs}
            defaultActiveSection={findSectionForPath(
              location.pathname,
              sectionListDocs,
            )}
            location={location}
            sectionList={sectionListDocs}
            title={data.markdownRemark.frontmatter.title}
          />
        </div>

      </div>
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
