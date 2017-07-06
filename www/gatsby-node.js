const Promise = require('bluebird');
const resolvePath = require('path').resolve;

exports.createPages = ({graphql, boundActionCreators}) => {
  const {createPage} = boundActionCreators;

  return new Promise((resolve, reject) => {
    const blogTemplate = resolvePath('./src/templates/blog.js');
    const communityTemplate = resolvePath('./src/templates/community.js');
    const docsTemplate = resolvePath('./src/templates/docs.js');
    const tutorialTemplate = resolvePath('./src/templates/tutorial.js');
    const homeTemplate = resolvePath('./src/templates/home.js');

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
              component: homeTemplate,
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
            let template;
            if (slug.includes('blog/')) {
              template = blogTemplate;
            } else if (slug.includes('community/')) {
              template = communityTemplate;
            } else if (slug.includes('docs/')) {
              template = docsTemplate;
            } else if (slug.includes('tutorial/')) {
              template = tutorialTemplate;
            }

            const createArticlePage = path =>
              createPage({
                path,
                component: template,
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
            // TODO Other page-types? (eg Contributing?)
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
      const slug = `/${relativePath.replace('.md', '.html')}`;

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
