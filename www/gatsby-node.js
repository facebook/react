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
                slug: slug,
              },
            });

          // Create docs, tutorial, and community pages.
          } else if (
            slug.includes('community/') ||
            slug.includes('docs/') ||
            slug.includes('tutorial/')
          ) {
            // TODO Parameterize Sidebar section list
            createPage({
              path: slug,
              component: articleTemplate,
              context: {
                slug: slug,
              },
            });

          } else {
            // TODO Other page-types
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

      // Website link
      createNodeField({
        node,
        fieldName: 'slug',
        fieldValue: slug,
      });

      // GitHub edit link
      createNodeField({
        node,
        fieldName: 'path',
        fieldValue: relativePath,
      });
      return;
  }
};
