# search-ui-extensions

![Travis Status](https://img.shields.io/travis/coveo/search-ui-extensions.svg)
[![NPM Version](https://img.shields.io/npm/v/coveo-search-ui-extensions.svg)](https://www.npmjs.com/package/coveo-search-ui-extensions)
[![Coverage Status](https://coveralls.io/repos/github/coveo/search-ui-extensions/badge.svg?branch=master)](https://coveralls.io/github/coveo/search-ui-extensions?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/coveo/search-ui-extensions/badge.svg?targetFile=package.json)](https://snyk.io/test/github/coveo/search-ui-extensions?targetFile=package.json)

This repository contains additionnal components meant to be used in conjunction with [Coveo Javascript Search Framework](https://github.com/coveo/search-ui) to provide additionnal functionnalities.

## Setup

Requires Node JS >= 8.0.

1. `npm install`
2. `npm run build`

## Structure

The code is written in [typescript](http://www.typescriptlang.org/) and compiled using [webpack](https://webpack.github.io/).

-   Under the `pages` folder, you have a working search page (index.html). At build time, it is copied to the `bin` folder.

    -   It references 2 style sheets (the base one from the Coveo Javascript Search Framework, and the one from the extension).
    -   It references 3 javascript file (the extension one built in this project, and the basic templates and library scripts).

-   Under the `src` folder, you have all the typescript source code for the custom components, with `src/Index.ts` being the starting point of the application.

-   Under the `src/sass` folder, you have all the css for the extension.

-   Under the `tests` folder, you have all the tests for the custom components.

## Build tasks

-   `npm run setup` will copy the needed ressources (`index.html`, `templates`, etc.) in the `bin` folder.
-   `npm run css` will build the sass files into a css file in the `bin` folder.
-   `npm run build` will run the `setup`, `css` task, then compile the typescript code.

## Dev

`npm run dev` will start a [webpack dev server](https://webpack.github.io/docs/webpack-dev-server.html). After it finishes, load [http://localhost:8080/index.html](http://localhost:8080/index.html) in a browser, and the `index.html` page should load.

Then, anytime you hit save in a typescript file, the server will reload your application.

## Tests

-   `npm run test` will execute the tests one time and give you the report
-   `npm run watchTest` will watch changes and reexecute the tests and coverage when saving a file.
