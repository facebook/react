/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
*/

'use strict';

const {resolve} = require('path');
const webpack = require('webpack');

exports.modifyWebpackConfig = ({config, stage}) => {
  // See https://github.com/FormidableLabs/react-live/issues/5
  config.plugin('ignore', () => new webpack.IgnorePlugin(/^(xor|props)$/));

  config.merge({
    resolve: {
      root: resolve(__dirname, './src'),
      extensions: ['', '.js', '.jsx', '.json'],
    },
  });
  return config;
};

exports.createPages = async ({graphql, boundActionCreators}) => {
  const {createPage, createRedirect} = boundActionCreators;

  const blogTemplate = resolve('./src/templates/blog.js');
  const communityTemplate = resolve('./src/templates/community.js');
  const docsTemplate = resolve('./src/templates/docs.js');
  const tutorialTemplate = resolve('./src/templates/tutorial.js');
  const homeTemplate = resolve('./src/templates/home.js');

  const allMarkdown = await graphql(
    `
    {
      allMarkdownRemark(limit: 1000) {
        edges {
          node {
            fields {
              redirect
              slug
            }
          }
        }
      }
    }
  `,
  );

  if (allMarkdown.errors) {
    console.error(allMarkdown.errors);

    throw Error(allMarkdown.errors);
  }

  allMarkdown.data.allMarkdownRemark.edges.forEach(edge => {
    const slug = edge.node.fields.slug;

    if (slug === '/index.html') {
      createPage({
        path: '/',
        component: homeTemplate,
        context: {
          slug,
        },
      });
    } else if (slug === 'docs/error-decoder.html') {
      // No-op so far as markdown templates go.
      // Error codes are managed by a page (which gets created automatically).
    } else if (
      slug.includes('blog/') ||
      slug.includes('community/') ||
      slug.includes('contributing/') ||
      slug.includes('docs/') ||
      slug.includes('tutorial/') ||
      slug.includes('warnings/')
    ) {
      let template;
      if (slug.includes('blog/')) {
        template = blogTemplate;
      } else if (slug.includes('community/')) {
        template = communityTemplate;
      } else if (
        slug.includes('contributing/') ||
        slug.includes('docs/') ||
        slug.includes('warnings/')
      ) {
        template = docsTemplate;
      } else if (slug.includes('tutorial/')) {
        template = tutorialTemplate;
      }

      const createArticlePage = path =>
        createPage({
          path: path,
          component: template,
          context: {
            slug,
          },
        });

      // Register primary URL.
      createArticlePage(slug);

      // Register redirects as well if the markdown specifies them.
      if (edge.node.fields.redirect) {
        let redirect = JSON.parse(edge.node.fields.redirect);
        if (!Array.isArray(redirect)) {
          redirect = [redirect];
        }

        redirect.forEach(fromPath =>
          createRedirect({
            fromPath: `/${fromPath}`,
            redirectInBrowser: true,
            toPath: `/${slug}`,
          }),
        );
      }
    }
  });

  const newestBlogEntry = await graphql(
    `
    {
      allMarkdownRemark(
        limit: 1,
        filter: { id: { regex: "/_posts/" } }
        sort: { fields: [fields___date], order: DESC }
      ) {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
    }
  `,
  );
  const newestBlogNode = newestBlogEntry.data.allMarkdownRemark.edges[0].node;

  // Blog landing page should always show the most recent blog entry.
  createRedirect({
    fromPath: '/blog/',
    redirectInBrowser: true,
    toPath: newestBlogNode.fields.slug,
  });
};

// Parse date information out of blog post filename.
const BLOG_POST_FILENAME_REGEX = /([0-9]+)\-([0-9]+)\-([0-9]+)\-(.+)\.md$/;

// Add custom fields to MarkdownRemark nodes.
exports.onCreateNode = ({node, boundActionCreators, getNode}) => {
  const {createNodeField} = boundActionCreators;

  switch (node.internal.type) {
    case 'MarkdownRemark':
      const {permalink, redirect_from} = node.frontmatter;
      const {relativePath} = getNode(node.parent);

      let slug = permalink;

      if (!slug) {
        if (relativePath.includes('_posts')) {
          // Blog posts don't have embedded permalinks.
          // Their slugs follow a pattern: /blog/<year>/<month>/<day>/<slug>.html
          // The date portion comes from the file name: <date>-<title>.md
          const match = BLOG_POST_FILENAME_REGEX.exec(relativePath);
          const year = match[1];
          const month = match[2];
          const day = match[3];
          const filename = match[4];

          slug = `/blog/${year}/${month}/${day}/${filename}.html`;

          const date = new Date(year, month - 1, day);

          // Blog posts are sorted by date and display the date in their header.
          createNodeField({
            node,
            name: 'date',
            value: date.toJSON(),
          });
        }
      }

      if (!slug) {
        slug = `/${relativePath.replace('.md', '.html')}`;

        // This should (probably) only happen for the index.md,
        // But let's log it in case it happens for other files also.
        console.warn(
          `Warning: No slug found for "${relativePath}". Falling back to default "${slug}".`,
        );
      }

      // Used to generate URL to view this content.
      createNodeField({
        node,
        name: 'slug',
        value: slug,
      });

      // Used to generate a GitHub edit link.
      createNodeField({
        node,
        name: 'path',
        value: relativePath,
      });

      // Used by createPages() above to register redirects.
      createNodeField({
        node,
        name: 'redirect',
        value: redirect_from ? JSON.stringify(redirect_from) : '',
      });
      return;
  }
};

exports.onCreatePage = async ({page, boundActionCreators}) => {
  const {createPage} = boundActionCreators;

  return new Promise(resolvePromise => {
    // page.matchPath is a special key that's used for matching pages only on the client.
    // Explicitly wire up all error code wildcard matches to redirect to the error code page.
    if (page.path.includes('docs/error-decoder.html')) {
      page.matchPath = 'docs/error-decoder:path?';
      page.context.slug = 'docs/error-decoder.html';

      createPage(page);
    }

    resolvePromise();
  });
};
