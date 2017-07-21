const {resolve} = require('path');

exports.modifyWebpackConfig = ({ config, stage }) => {
  config.merge({
    resolve: {
      root: resolve(__dirname, './src'),
      extensions: ['', '.js', '.jsx', '.json'],
    }
  });
  return config;
};

exports.createPages = async ({graphql, boundActionCreators}) => {
  const {createPage} = boundActionCreators;

  const blogTemplate = resolve('./src/templates/blog.js');
  const communityTemplate = resolve('./src/templates/community.js');
  const docsTemplate = resolve('./src/templates/docs.js');
  const errorDecoderTemplate = resolve('./src/templates/error-decoder.js');
  const tutorialTemplate = resolve('./src/templates/tutorial.js');
  const homeTemplate = resolve('./src/templates/home.js');

  const allMarkdown = await graphql(`
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
  `);

  if (allMarkdown.errors) {
    console.error(allMarkdown.errors);

    reject(allMarkdown.errors);
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
      createPage({
        path: '/docs/error-decoder.html*',
        component: errorDecoderTemplate,
        context: {
          slug,
        },
      });

    } else if (
      slug.includes('blog/') ||
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
      // https://github.com/gatsbyjs/gatsby/pull/1068
      if (edge.node.fields.redirect) {
        const redirect = JSON.parse(edge.node.fields.redirect);
        if (Array.isArray(redirect)) {
          redirect.forEach(createArticlePage);
        } else {
          createArticlePage(redirect);
        }
      }
    }
  });

  /* TODO Register '/blog.html' redirect to most recent blog entry.
   * And delete redundant 'pages/blog.html.js'
   * github.com/gatsbyjs/gatsby/pull/1068
  const mostRecentBlogMarkdown = await graphql(`
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
  `);
  */
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
          if (match) {
            slug = `/blog/${match[1]}/${match[2]}/${match[3]}/${match[4]}.html`;
          }

          const date = new Date(match[1], match[2], match[3]);

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
          `Warning: No slug found for "${relativePath}". Falling back to default "${slug}".`
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
