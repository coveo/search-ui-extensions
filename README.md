# search-ui-extensions

[![Build Status](https://travis-ci.org/coveo/search-ui-extensions.svg?branch=master)](https://travis-ci.org/coveo/search-ui-extensions)
[![NPM Version](https://img.shields.io/npm/v/coveo-search-ui-extensions.svg)](https://www.npmjs.com/package/coveo-search-ui-extensions)
[![Coverage Status](https://coveralls.io/repos/github/coveo/search-ui-extensions/badge.svg?branch=master)](https://coveralls.io/github/coveo/search-ui-extensions?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/coveo/search-ui-extensions/badge.svg?targetFile=package.json)](https://snyk.io/test/github/coveo/search-ui-extensions?targetFile=package.json)

This repository contains new components meant to be used in conjunction with the [Coveo Javascript Search Framework](https://github.com/coveo/search-ui) to provide additional functionalities.

## Setup

Requires Node JS >= 8.0.

1. `npm install`

2. `npm run build`

## Structure

The code is written in [TypeScript](http://www.typescriptlang.org/) and compiled using [webpack](https://webpack.github.io/).

-   Under the `pages` folder, you have a working search page (index.html). At build time, it is copied to the `bin` folder.

    -   It references 2 style sheets (the base one from the Coveo JavaScript Search Framework, and the one from the extension).

    -   It references 3 JavaScript files (i.e., the extension one built in this project, the basic templates, and the library scripts).

-   Under the `src` folder, you have all the typescript source code for the custom components, with `src/Index.ts` being the starting point of the application.

-   Under the `src/sass` folder, you have all the css for the extension.

-   Under the `tests` folder, you have all the tests for the custom components.

## Build tasks

-   `npm run setup` will copy the needed resources (`index.html`, `templates`, etc.) in the `bin` folder.

-   `npm run css` will build the sass files into a css file in the `bin` folder.

-   `npm run build` will run the `setup` and `css` tasks. It will then compile the TypeScript code.

## Dev

`npm run dev` will start a [webpack dev server](https://webpack.github.io/docs/webpack-dev-server.html). After it finishes, load [http://localhost:8080/pages/attached_result.html](http://localhost:8080/pages/attached_result.html) in a browser, and the `index.html` page should load.

Then, anytime you save a TypeScript file, the server will reload your application.

## Tests

-   `npm run test` will execute the tests one time and generate the report.

-   `npm run watchTest` will watch changes and re-execute the tests and coverage when saving a file.

## Running functional tests

1. `npm run dev` will start the developer server.

2. `npx cypress run` will run the cypress functional tests suite.

To add a new test suite simply add a new spec file in the `./cypress/integration/` folder.

## Compatibility

The components provided in this repository should be used as examples to build your own components. Since this project is still in the pre-release phase, backward compatibility of the compiled JavaScript is not guaranteed. Note that the TypeScript definitions could also be modified without notice.

As new releases could impact your implementation, we strongly recommend that you validate the content of each new release before upgrading to a newer version.
