# React — documentation site

## Getting started

### Prerequisites

1. Git
1. Node: install version 7.6 or greater
1. Yarn: `npm i -g yarn` to install it globally via NPM
1. A clone of the [React repo](https://github.com/facebook/react) on your local machine
1. A fork of the repo (for any contributions)

### Installation

1. `cd react` to go into the project root
1. `yarn` to install the main NPM dependencies
1. `cd www` to go into the website project
1. `yarn` to install the website's NPM dependencies

### Running locally

1. `yarn dev` to start the hot-reloading development server powered by Gatsby
1. `open http://localhost:8000` to open the site in your favourite browser

## Contributing

### Create a branch

1. `git checkout master` from any folder in your local react repository
1. `git pull origin master` to ensure you have the latest main code
1. `git checkout -b wwwTheNameOfMyChange` (replacing `TheNameOfMyChange` with a suitable name) to create a branch

### Make the change

1. Follow the "Running locally" instructions
1. Save the files and check in the browser
  1. Any React components in `src/components` or `src/templates` will hot-reload
  1. If working with plugins, you may need to remove the `.cache` directory and restart the server

### Test the change

1. If possible, test any visual changes in all latest versions of common browsers, on both desktop and mobile.
1. Run `yarn prettier-all && yarn lint` from the project root (outside of `www`)

### Push it

1. `git add -A && git commit -m "My message"` (replacing `My message` with a commit message, such as `Fixed header logo on Android`) to stage and commit your changes
1. `git push yourname wwwTheNameOfMyChange`
1. Go to the [React repo](https://github.com/facebook/react) and you should see recently pushed branches.
1. ... follow GitHub's instructions...
1. If possible, include any screenshots of visual changes. A Netlify build will also be automatically created once you make your PR, so other people can see your change.

## Troubleshooting

- `yarn reset` to clear the local cache
