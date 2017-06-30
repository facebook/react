import React from "react"
import Link from "gatsby-link"
import { Container } from "react-responsive-grid"

import { rhythm, scale } from "../utils/typography"

class Template extends React.Component {
  render() {
    const { location, children } = this.props
    let header
    if (location.pathname === "/") {
      header = (
        <h1
          style={{
            ...scale(1.5),
            marginBottom: rhythm(1.5),
            marginTop: 0,
          }}
        >
          <Link
            style={{
              boxShadow: "none",
              textDecoration: "none",
              color: "inherit",
            }}
            to={"/"}
          >
            Gatsby Starter Blog
          </Link>
        </h1>
      )
    } else {
      header = (
        <h3
          style={{
            fontFamily: "Montserrat, sans-serif",
            marginTop: 0,
            marginBottom: rhythm(-1),
          }}
        >
          <Link
            style={{
              boxShadow: "none",
              textDecoration: "none",
              color: "inherit",
            }}
            to={"/"}
          >
            Gatsby Starter Blog
          </Link>
        </h3>
      )
    }
    return (
      <Container
        style={{
          maxWidth: rhythm(24),
          padding: `${rhythm(1.5)} ${rhythm(3 / 4)}`,
        }}
      >
        {header}
        {children()}
      </Container>
    )
  }
}

Template.propTypes = {
  children: React.PropTypes.function,
  location: React.PropTypes.object,
  route: React.PropTypes.object,
}

export default Template
