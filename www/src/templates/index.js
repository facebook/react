import ButtonLink from '../components/ButtonLink';
import React from 'react';
import Link from 'gatsby-link';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

import arrowSvg from '../icons/arrow.svg';

// TODO The non-markdown portions of this page won't get localized currently.
// TODO Create (global) CSS for this template since the markdown in index.md has hard-coded styles.
// TODO Load code snippets (React Live snippets?) into index.md placeholders.

const Index = ({data}) => (
  <div>
    <main className="site__main home">
      <header className="hero below_nav">
        <div className="hero__inner">
          <div className="wrapper">
            <h1 className="hero__title">React</h1>
            <p className="hero__subtitle">
              A JavaScript library for building user interfaces
            </p>
            <div className="hero__cta_group cta_group">
              <div className="cta_group__item">
                <ButtonLink
                  to="/docs/hello-world.html"
                  type="primary">
                  Get Started
                </ButtonLink>
              </div>
              <div className="cta_group__item">
                <ButtonLink
                  to="/tutorial/tutorial.html"
                  type="secondary">
                  Take the tutorial
                  {' '}
                  <img src={arrowSvg} alt="Search" height="12" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div
        className="wrapper article__inner"
        dangerouslySetInnerHTML={{__html: data.markdownRemark.html}}
      />
    </main>
    <section className="prefooter_nav">
      <div className="wrapper">
        <div className="cta_group">
          <div className="cta_group__item">
            <ButtonLink
              to="/docs/hello-world.html"
              type="primary">
              Get Started
            </ButtonLink>
          </div>
          <div className="cta_group__item">
            <ButtonLink
              to="/tutorial/tutorial.html"
              type="secondary">
              Take the tutorial
              {' '}
              <img src={arrowSvg} alt="Search" height="12" />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  </div>
);

Index.propTypes = {
  data: PropTypes.object.isRequired,
};

export const pageQuery = graphql`
  query IndexMarkdown($slug: String!) {
    markdownRemark(fields: {slug: {eq: $slug}}) {
      html
      frontmatter {
        title
      }
    }
  }
`;

export default Index;
