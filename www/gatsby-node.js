const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const select = require('unist-util-select')
const fs = require('fs-extra')

exports.createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators

  return new Promise((resolve, reject) => {
    const pages = []
    const blogTemplate = path.resolve('./src/templates/blog.js')
    resolve(
      graphql(`
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
      `).then(result => {
        if (result.errors) {
          console.log(result.errors)
          reject(result.errors)
        }

        // Create blog posts pages.
        _.each(result.data.allMarkdownRemark.edges, edge => {
          createPage({
            path: edge.node.fields.slug, // required
            component: blogTemplate,
            context: {
              slug: edge.node.fields.slug,
            },
          })
        })
      })
    )
  })
}

// Add custom slug for blog posts to both File and MarkdownRemark nodes.
exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNodeField } = boundActionCreators

  switch (node.internal.type) {
    case 'MarkdownRemark':
      const {relativePath} = getNode(node.parent)
      const slug = `/${relativePath.replace('.md', '.html')}` // TODO

      // Website link
      createNodeField({
        node,
        fieldName: 'slug',
        fieldValue: slug,
      })

      // GitHub edit link
      createNodeField({
        node,
        fieldName: 'path',
        fieldValue: relativePath,
      })
      return
  }
}
