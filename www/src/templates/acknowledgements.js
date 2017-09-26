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
import MarkdownHeader from 'components/MarkdownHeader';
import PropTypes from 'prop-types';
import React from 'react';
import TitleAndMetaTags from 'components/TitleAndMetaTags';
import {sharedStyles} from 'theme';
import {urlRoot} from 'constants';

const Acknowlegements = ({data, location}) => {
  const title = 'Acknowledgements - React';
  const titlePrefix = data.markdownRemark.frontmatter.title || '';
  return (
    <div css={{width: '100%'}}>
      <TitleAndMetaTags
        title={title}
        ogUrl={`${urlRoot}/${data.markdownRemark.fields.path}`}
      />
      <Container>
        <MarkdownHeader title={titlePrefix} />
        <div
          css={sharedStyles.markdown}
          dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
        />
      </Container>
    </div>
  );
};

Acknowlegements.propTypes = {
  data: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query TemplateAcknowledgementsMarkdown($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        next
        prev
      }
      fields {
        path
      }
    }
  }
`;

export default Acknowlegements;
