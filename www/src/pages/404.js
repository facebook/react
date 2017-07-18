import Link from 'gatsby-link';
import MarkdownHeader from '../components/MarkdownHeader';
import Container from '../components/Container';
import React from 'react';

const PageNotFound = () => (
  <Container>
    <MarkdownHeader title="Page Not Found" />
    <p>
      We couldn't find what you were looking for.
    </p>
    <p>
      Please contact the owner of the site that linked you to the original URL and let them know their link is broken.
    </p>
  </Container>
);

export default PageNotFound;
