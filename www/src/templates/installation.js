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
import React, {Component} from 'react';
import StickyResponsiveSidebar from 'components/StickyResponsiveSidebar';
import TitleAndMetaTags from 'components/TitleAndMetaTags';
import {createLinkDocs} from 'utils/createLink';
import findSectionForPath from 'utils/findSectionForPath';
import {sectionListDocs} from 'utils/sectionList';
import {sharedStyles} from 'theme';
import createOgUrl from 'utils/createOgUrl';

// HACK: copied from 'installation.md'
// TODO: clean this up.
function setSelected(value) {
  var tabs = document.querySelectorAll('li[role="tab"]');
  for (var i = 0; i < tabs.length; ++i) {
    var tab = tabs[i];
    if (tab.className === 'button-' + value) {
      tabs[i].setAttribute('aria-selected', 'true');
      tabs[i].setAttribute('tabindex', '0');
    } else {
      tabs[i].setAttribute('aria-selected', 'false');
      tabs[i].setAttribute('tabindex', '-1');
    }
  }
}

function keyToggle(e, value, prevTab, nextTab) {
  // left arrow <-
  if (e.keyCode === 37) {
    document.getElementById(prevTab).focus();
    display('target', prevTab);
  }
  // right arrow ->
  if (e.keyCode === 39) {
    document.getElementById(nextTab).focus();
    display('target', nextTab);
  }
}

function display(type, value) {
  setSelected(value);
  var container = document.getElementsByTagName('section')[0].parentNode
    .parentNode;
  container.className =
    'display-' +
    type +
    '-' +
    value +
    ' ' +
    container.className.replace(RegExp('display-' + type + '-[a-z]+ ?'), '');
}

var foundHash = false;
function selectTabForHashLink(location) {
  var hashLinks = document.querySelectorAll('a.anchor');
  for (var i = 0; i < hashLinks.length && !foundHash; ++i) {
    if (location && hashLinks[i].hash === location.hash) {
      var parent = hashLinks[i].parentElement;
      while (parent) {
        if (parent.tagName === 'SECTION') {
          var target = null;
          if (parent.className.indexOf('fiddle') > -1) {
            target = 'fiddle';
          } else if (parent.className.indexOf('newapp') > -1) {
            target = 'newapp';
          } else if (parent.className.indexOf('existingapp') > -1) {
            target = 'existingapp';
          } else {
            break; // assume we don't have anything.
          }
          display('target', target);
          foundHash = true;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }
}

// HACK Expose toggle functions global for markup-defined event handlers.
// Don't acceess the 'window' object without checking first though,
// Because it would break the (Node only) Gatsby build step.
if (typeof window !== 'undefined') {
  window.keyToggle = keyToggle;
  window.display = display;
}

class InstallationPage extends Component {
  componentDidMount() {
    const location = this.props.location;
    // If we are coming to the page with a hash in it (i.e. from a search, for example), try to get
    // us as close as possible to the correct platform and dev os using the hashtag and section walk up.
    if (location && location.hash !== '' && location.hash !== 'content') {
      // content is default
      // Hash links are added a bit later so we wait for them.
      // HACK we don't have a window object if/when Gatsby executes this in node
      if (
        typeof window !== 'undefined' &&
        typeof window.addEventListener === 'function'
      ) {
        window.addEventListener(
          'DOMContentLoaded',
          selectTabForHashLink.bind(null, location),
        );
      }
    }
    display('target', 'fiddle');
  }

  render() {
    const {data, location} = this.props;
    const {markdownRemark} = data;

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
          title="Installation - React"
          ogUrl={createOgUrl(markdownRemark.fields.slug)}
        />
        <div css={{flex: '1 0 auto'}}>
          <Container>
            <div css={sharedStyles.articleLayout.container}>
              <Flex type="article" direction="column" grow="1" halign="stretch">
                <MarkdownHeader title={markdownRemark.frontmatter.title} />

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
                  createLink={createLinkDocs}
                  defaultActiveSection={findSectionForPath(
                    location.pathname,
                    sectionListDocs,
                  )}
                  location={location}
                  sectionList={sectionListDocs}
                  title="Installation"
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

InstallationPage.propTypes = {
  data: PropTypes.shape({markdownRemark: PropTypes.object.isRequired})
    .isRequired,
  location: PropTypes.object.isRequired,
};

// eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query InstallationMarkdown($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
        next
        prev
      }
      fields {
        path
        slug
      }
    }
  }
`;

export default InstallationPage;
