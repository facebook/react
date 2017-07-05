const Promise = require('bluebird');
const path = require('path');
const select = require('unist-util-select');
const fs = require('fs-extra');

exports.createPages = ({graphql, boundActionCreators}) => {
  const {createPage} = boundActionCreators;

  return new Promise((resolve, reject) => {
    const pages = [];

    const articleTemplate = path.resolve('./src/templates/article.js');
    const indexTemplate = path.resolve('./src/templates/index.js');

    resolve(
      graphql(
        `
        {
          allMarkdownRemark(limit: 1000) {
            edges {
              node {
                fields {
                  permalink
                  redirect
                  slug
                }
              }
            }
          }
        }
      `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors);
          reject(result.errors);
        }

        result.data.allMarkdownRemark.edges.forEach(edge => {
          const slug = edge.node.fields.slug;

          // Create landing page
          if (slug === '/index.html') {
            createPage({
              path: '/',
              component: indexTemplate,
              context: {
                slug,
              },
            });

          // Create docs, tutorial, and community pages.
          } else if (
            slug.includes('community/') ||
            slug.includes('docs/') ||
            slug.includes('tutorial/')
          ) {
            // TODO Parameterize Sidebar section list.
            const createArticlePage = path =>
              createPage({
                path,
                component: articleTemplate,
                context: {
                  slug,
                },
              });

            // Register primary URL.
            createArticlePage(slug);

            // Register redirects as well if the markdown specifies them.
            // TODO Once Gatsby has a built-in solution for redirects, switch to it.
            if (edge.node.fields.redirect) {
              const redirect = JSON.parse(edge.node.fields.redirect);
              if (Array.isArray(redirect)) {
                redirect.forEach(createArticlePage);
              } else {
                createArticlePage(redirect);
              }
            }

          } else {
            // TODO Other page-types (eg Blog)
          }
        });
      })
    );
  });
};

// Add custom fields to MarkdownRemark nodes.
exports.onCreateNode = ({node, boundActionCreators, getNode}) => {
  const {createNodeField} = boundActionCreators;

  switch (node.internal.type) {
    case 'MarkdownRemark':
      const {relativePath} = getNode(node.parent);
      const slug = `/${relativePath.replace('.md', '.html')}`; // TODO
      // TODO permalink instead of slug if set?

      // Website link
      createNodeField({
        node,
        name: 'slug',
        value: slug,
      });

      // GitHub edit link
      createNodeField({
        node,
        name: 'path',
        value: relativePath,
      });

      const {permalink, redirect_from} = node.frontmatter;

      createNodeField({
        node,
        name: 'permalink',
        value: permalink,
      });

      createNodeField({
        node,
        name: 'redirect',
        value: redirect_from ? JSON.stringify(redirect_from) : '',
      });
      return;
  }
};
