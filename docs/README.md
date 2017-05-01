# React Documentation & Website

## [Read the React Documentation](https://facebook.github.io/react/)

This folder is not the right place to *read* the documentation.

Instead, head over [to the React website](https://facebook.github.io/react/) to read it.

This folder only contains the source code for the website.

## Installation

If you are working on the site, you will want to install and run a local copy of it.

We use [Jekyll](http://jekyllrb.com/) to build the site using ([mostly](http://zpao.com/posts/adding-line-highlights-to-markdown-code-fences/)) Markdown, and we host it by pushing HTML to [GitHub Pages](http://pages.github.com/).

### Dependencies

In order to use Jekyll, you will need to have Ruby installed. macOS comes pre-installed with Ruby, but you may need to update RubyGems (via `gem update --system`).
Otherwise, [RVM](https://rvm.io/) and [rbenv](https://github.com/sstephenson/rbenv) are popular ways to install Ruby.

 - [Ruby](http://www.ruby-lang.org/) (version >= 1.8.7)
 - [RubyGems](http://rubygems.org/) (version >= 1.3.7)
 - [Bundler](http://gembundler.com/)

The version of the Pygment syntax highlighter used by Jekyll requires Python 2.7.x (not 3.x). macOS comes pre-installed with Python 2.7, but you may need to install it on other OSs.

 - [Python](https://www.python.org) (version 2.7.x)

Once you have RubyGems and installed Bundler (via `gem install bundler`), use it to install the dependencies:

```sh
$ cd react/docs
$ bundle install # Might need sudo.
$ npm install
```

### Instructions

The site requires React, so first make sure you've built the project (via [`grunt`](http://gruntjs.com/getting-started)).

Use Jekyll to serve the website locally (by default, at `http://localhost:4000`):

```sh
$ cd react/docs
$ bundle exec rake
$ bundle exec rake fetch_remotes
$ bundle exec jekyll serve -w
$ open http://localhost:4000/react/index.html
```

We use [SASS](http://sass-lang.com/) (with [Bourbon](http://bourbon.io/)) for our CSS, and we use JSX to transform some of our JS.
If you only want to modify the HTML or Markdown, you do not have to do anything because we package pre-compiled copies of the CSS and JS.
If you want to modify the CSS or JS, use [Rake](http://rake.rubyforge.org/) to compile them:

```sh
$ cd react/docs
$ bundle exec rake watch # Automatically compiles as needed.
# bundle exec rake         Manually compile CSS and JS.
# bundle exec rake js      Manually compile JS, only.
```

## Afterthoughts

### Updating `facebook.github.io/react`

The easiest way to do this is to have a separate clone of this repository, checked out to the `gh-pages` branch. We have a build step that expects this to be in a directory named `react-gh-pages` at the same depth as `react`. Then it's just a matter of running `grunt docs`, which will compile the site and copy it out to this repository. From there, you can check it in.

**Note:** This should only be done for new releases. You should create a tag corresponding to the release tag in the main repository.

We also have a rake task that does the same thing (without creating commits). It expects the directory structure mentioned above.

```sh
$ bundle exec rake release
```

### Removing the Jekyll / Ruby Dependency

In an ideal world, we would not be adding a Ruby dependency on part of our project. We would like to move towards a point where we are using React to render the website.
