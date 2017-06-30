import React from "react"
import Link from "gatsby-link"
import get from "lodash/get"
import Helmet from "react-helmet"
import include from "underscore.string/include"

import Bio from "../components/Bio"
import { rhythm } from "../utils/typography"

class BlogIndex extends React.Component {
  render() {
    // console.log("props", this.props)
    const pageLinks = []
    const siteTitle = get(this, "props.data.site.siteMetadata.title")
    const posts = get(this, "props.data.allMarkdownRemark.edges")
    posts.forEach(post => {
      if (post.node.path !== "/404/") {
        const title = get(post, "node.frontmatter.title") || post.node.path
        pageLinks.push(
          <li
            key={post.node.path}
            style={{
              marginBottom: rhythm(1 / 4),
            }}
          >
            <Link style={{ boxShadow: "none" }} to={post.node.fields.slug}>
              {post.node.frontmatter.title}
            </Link>
          </li>
        )
      }
    })

    return (
      <div>
        <Helmet title={get(this, "props.data.site.siteMetadata.title")} />
        <Bio />
        <ul>
          {pageLinks}
        </ul>
      </div>
    )
  }
}

BlogIndex.propTypes = {
  route: React.PropTypes.object,
}

export default BlogIndex

export const pageQuery = graphql`
query IndexQuery {
  site {
    siteMetadata {
      title
    }
  }
  allMarkdownRemark {
    edges {
      node {
        fields {
          slug
        }
        frontmatter {
          title
        }
      }
    }
  }
}
`
