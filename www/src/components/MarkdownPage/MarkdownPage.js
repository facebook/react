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
import Flex from 'components/Flex';
import MarkdownHeader from 'components/MarkdownHeader';
import NavigationFooter from 'templates/components/NavigationFooter';
import PropTypes from 'prop-types';
import React from 'react';
import StickyResponsiveSidebar from 'components/StickyResponsiveSidebar';
import TitleAndMetaTags from 'components/TitleAndMetaTags';
import findSectionForPath from 'utils/findSectionForPath';
import toCommaSeparatedList from 'utils/toCommaSeparatedList';
import {media, sharedStyles} from 'theme';
import {urlRoot} from 'constants';

class MarkdownPage extends React.Component {
  constructor(props) {
    super(props);
    this.toggleMenuOverlay = this.toggleMenuOverlay.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.state = {
      isMenuOverlayOpen: false,
    };
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.isMenuOverlayOpen && !prevState.isMenuOverlayOpen) {
      // Menu has been opened
      window.addEventListener('resize', this.handleWindowResize);
    }
  }
  handleWindowResize() {
    const mediaQuery = media.greaterThan('small').replace('@media ', '');
    if (window.matchMedia(mediaQuery).matches) {
      // If the screen has been resized >= 'small'
      this.toggleMenuOverlay(false);
    }
  }
  toggleMenuOverlay(willOpen) {
    this.setState(
      {
        isMenuOverlayOpen: willOpen,
      },
      () => {
        this.context.onMenuOverlayToggle(this.state.isMenuOverlayOpen);
      },
    );
  }
  handleTouchMove(evt) {
    // Prevent anything else from being touched when the menu overlay is open, to avoid touch scrolling issues
    if (this.state.isMenuOverlayOpen) {
      evt.preventDefault();
    }
  }
  render() {
    const {
      authors,
      createLink,
      date,
      ogDescription,
      location,
      markdownRemark,
      sectionList,
      titlePostfix = '',
    } = this.props;
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
          overflow: 'auto', // This is required for the mobile footer layout
        }}
        onTouchMove={this.handleTouchMove}>
        <TitleAndMetaTags
          title={`${titlePrefix}${titlePostfix}`}
          ogUrl={`${urlRoot}/${markdownRemark.fields.path || ''}`}
          ogDescription={ogDescription}
        />
        <div css={{flex: '1 0 auto'}}>
          <Container>
            <div css={sharedStyles.articleLayout.container}>
              <Flex type="article" direction="column" grow="1" halign="stretch">
                <MarkdownHeader title={titlePrefix} />

                {(date || hasAuthors) &&
                  <div css={{marginTop: 15}}>
                    {date}{' '}
                    {hasAuthors &&
                      <span>
                        by{' '}
                        {toCommaSeparatedList(authors, author => (
                          <a
                            css={sharedStyles.link}
                            href={author.frontmatter.url}
                            key={author.frontmatter.name}>
                            {author.frontmatter.name}
                          </a>
                        ))}
                      </span>}
                  </div>}

                <div css={sharedStyles.articleLayout.content}>
                  <div
                    css={[sharedStyles.markdown]}
                    dangerouslySetInnerHTML={{__html: markdownRemark.html}}
                  />

                  {markdownRemark.fields.path &&
                    <div css={{marginTop: 80}}>
                      <a
                        css={sharedStyles.articleLayout.editLink}
                        href={`https://github.com/facebook/react/tree/master/docs/${markdownRemark.fields.path}`}>
                        Edit this page
                      </a>
                    </div>}
                </div>
              </Flex>

              <div css={sharedStyles.articleLayout.sidebar}>
                <StickyResponsiveSidebar
                  createLink={createLink}
                  defaultActiveSection={findSectionForPath(
                    location.pathname,
                    sectionList,
                  )}
                  location={location}
                  onRequestToggle={this.toggleMenuOverlay}
                  open={this.state.isMenuOverlayOpen}
                  sectionList={sectionList}
                />
              </div>
            </div>
          </Container>
        </div>

        {/* TODO Read prev/next from index map, not this way */}
        {(markdownRemark.frontmatter.next || markdownRemark.frontmatter.prev) &&
          <NavigationFooter
            location={location}
            next={markdownRemark.frontmatter.next}
            prev={markdownRemark.frontmatter.prev}
          />}
      </Flex>
    );
  }
}

MarkdownPage.defaultProps = {
  authors: [],
};

// TODO Better types
MarkdownPage.propTypes = {
  authors: PropTypes.array.isRequired,
  createLink: PropTypes.func.isRequired,
  date: PropTypes.string,
  location: PropTypes.object.isRequired,
  markdownRemark: PropTypes.object.isRequired,
  sectionList: PropTypes.array.isRequired,
};

MarkdownPage.contextTypes = {
  onMenuOverlayToggle: PropTypes.func.isRequired,
};

export default MarkdownPage;
