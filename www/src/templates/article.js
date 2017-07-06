import MarkdownHeader from '../components/MarkdownHeader';
import NavigationFooter from '../components/NavigationFooter';
import React from 'react';
import {StickyContainer} from 'react-sticky';
import PropTypes from 'prop-types';
import StickySidebar from '../components/StickySidebar';
import slugify from '../utils/slugify';

// TODO Use 'react-helmet' to set metadata

// TODO (HACK) This data should be passed in as a parameter
import sectionList from '../../../docs/_data/nav_docs.yml';

const getActiveSection = (pathname, sections) => {
  let activeSection = sections[0]; // Default to first

  sections.forEach(section => {
    const match = section.items.some(item =>
      pathname.includes(slugify(item.id)),
    );
    if (match) {
      activeSection = section;
    }
  });

  return activeSection;
};

const Article = ({data, location}) => (
  <div className="site__main">
    <div className="wrapper">
      <StickyContainer className="article" id="nav_bounds">
        <article className="article__main below_nav">
          <div className="article__inner">
            <MarkdownHeader
              path={data.markdownRemark.fields.path}
              title={data.markdownRemark.frontmatter.title}
            />
          </div>

          {/* TODO Add remark plugin if first child is paragraph, extract:
            ... this is handled with p:first-child for now
          <p className="article__sub article__inner">
            TODO
          </p>
          */}

          <div
            className="article__body article__inner"
            dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
          />
        </article>

        <div className="article__nav__wrapper">
          <StickySidebar
            defaultActiveSection={getActiveSection(
              location.pathname,
              sectionList,
            )}
            location={location}
            sectionList={sectionList}
          />
        </div>
      </StickyContainer>

      {/* TODO Read prev/next from index map, not this way */}
      <NavigationFooter
        next={data.markdownRemark.frontmatter.next}
        prev={data.markdownRemark.frontmatter.prev}
      />
    </div>
  </div>
);

Article.propTypes = {
  data: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query TemplateDocsMarkdown($slug: String!) {
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

export default Article;
