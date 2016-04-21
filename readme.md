# Roots Mini

[![tests](https://img.shields.io/npm/v/roots-mini.svg?style=flat)](https://www.npmjs.com/package/roots-mini) [![tests](http://img.shields.io/travis/carrot/roots-mini/develop.svg?style=flat)](https://travis-ci.org/carrot/roots-mini) [![dependencies](http://img.shields.io/gemnasium/carrot/roots-mini.svg?style=flat)](https://gemnasium.com/carrot/roots-mini)

Experimenting with a new [webpack](http://webpack.github.io) core for roots.

## Why should you care?

The thinking behind this experiment is explained in [this article](https://medium.com/@jescalan/eaa10c75eb22). Please feel free to comment and contribute.

## Setup

- Make sure you are running [node.js >= v4](https://nodejs.org/en/).
- Make sure you have an [editorconfig plugin](http://editorconfig.org/#download) installed for your text editor
- Make sure you have a [standard js linter](http://standardjs.com/index.html#usage) installed, tests will not pass if linting fails
- Make sure you are familiar with [ES6](https://medium.com/sons-of-javascript/javascript-an-introduction-to-es6-1819d0d89a0f)
- Make sure you are familiar with [test-driven development](https://www.wikiwand.com/en/Test-driven_development)

## Installation

- `npm install roots-mini -g`
- `rootsmini new projectname`

## Usage

Roots can operate through either a javascript API or a CLI interface. We'll break them both down below.

### Command Line Interface

Roots mini can be accessed through the command line if installed globally through npm (`npm i roots-mini -g`). It exposes a binary by the name of `rootsmini`.

#### Commands

- `rootsmini watch`: watches your project, opens up a local server, recompiles and refreshes your browser when a file is changed and saved
- `rootsmini compile`: compiles a roots project once
- `rootsmini new <projectname>`: creates a new roots-mini project
- `rootsmini clean`: removes your project's output directory

You can find roots-mini's [standard starter template here](https://github.com/carrot/roots-mini-base), and it can be installed through [sprout](https://github.com/carrot/sprout).

### Javacript API

The Roots module exposes a single class through which all functionality operates. An instance of the class should be created for each project being compiled with Roots.

```js
import Roots from 'roots'

let project = new Roots({ root: 'path/to/project/root' })
```

The above shows a minimal instantiation, but the constructor accepts a wide variety of options, listed below.

Option                 | Description                                                                                                                                                                                                                                                                                                                         | Default
:--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------
**root**               | **[required]** An absolute path to the root of your project.                                                                                                                                                                                                                                                                        |
**matchers**           | An object with `jade`, `css`, and `js` keys. Each key is a [micromatch](https://github.com/jonschlinkert/micromatch) string, and represents which files should be pulled into the pipeline to be processed. Defaults are . Be very careful if you are trying to change this.                                                        | `**/*.jade`, `**/*.css`, and `**/*.js`
**postcss**            | An object that can contain a `plugins` key, which is an array of [plugins to be passed to PostCSS](http://postcss.parts/) for CSS processing, and a `parser`, `stringifier`, and/or `syntax` key, each of which are objects and take [any of the postcss-loader options](https://github.com/postcss/postcss-loader#custom-syntaxes) |
**babelConfig**        | A [configuration object for Babel](http://babeljs.io/docs/usage/options/) for JS processing.                                                                                                                                                                                                                                        |
**jade**               | A [configuration object for jade](http://jade-lang.com/api/).                                                                                                                                                                                                                                                                       |
**dumpDirs**           | An array of directories which, if direct children of the project root, will dump their contents to the root on compile. Defaults to                                                                                                                                                                                                 | `['views', 'assets']`.
**locals**             | An object containing locals to be passed to jade views. This can be used for values, functions, any sort of view helper you need.                                                                                                                                                                                                   |
**ignore**             | An array of [micromatch](https://github.com/jonschlinkert/micromatch) strings, each one defining a file pattern to be ignored from compilation.                                                                                                                                                                                     |
**outputDir**          | The name or path of the folder your project will be compiled into, on top of the project's root.                                                                                                                                                                                                                                    | `'public'`
**cleanUrls**          | Remove `.html` from your paths during `roots.watch`.                                                                                                                                                                                                                                                                                | `true`
**plugins**            | An array of webpack plugins.                                                                                                                                                                                                                                                                                                        |
**entry**              | Webpack entry object duplicate. Can be used for code splitting and/or to use multiple bundles.                                                                                                                                                                                                                                      | `{ 'js/main': ['./assets/js/index.js'] }`
**modulesDirectories** | Webpack modulesDirectories array option, to select where modules can be loaded from.                                                                                                                                                                                                                                                | `['node_modules', 'bower_components']`
**module.loaders**     | Allows you to define an array of custom loaders. See [webpack's documentation](https://webpack.github.io/docs/configuration.html#module-loaders) for details                                                                                                                                                                        |
**resolve.alias**      | Set up loader aliases, like if you wanted to load a local loader. See [webpack's documentation](https://webpack.github.io/docs/configuration.html#resolve-alias) for details                                                                                                                                                        |

> **Note:** Not familiar with minimatch or micromatch? Check out the [minimatch cheat sheet](https://github.com/motemen/minimatch-cheat-sheet) and test your patterns with [globtester](http://www.globtester.com). Trust us, it's a much cleaner and easier way to write regexes for the file system : )

Roots exposes a simpler and more straightforward configuration interface than if you were to set up the webpack configuration yourself. However, if you'd like to directly edit the webpack config, you can still do this after the project has been instantiated through the `config` property on each instance.

```js
let project = new Roots({ root: 'path/to/project/root' })
console.log(project.config) // echoes bare webpack config object, can be edited
```

If you decide to edit the webpack config object directly, _be careful_. It is easy to break the way roots works without knowing exactly what you are doing here. If there's something you are looking to customize that is not part of roots' options, it's better to open an issue and ask for it to be made customizable, then we'll get you a much cleaner way to do it!

Note that each project is an event emitter, and all feedback on what the project is doing will come back through events on the `project` instance. Currently the following events are supported:

- `compile`: the project has finished compiling
- `warning`: the project has emitted a warning - not fatal but should be checked out
- `error`: the project has errored and will not complete compilation
- `remove`: roots-mini has removed a particular path

To compile an instantiated project, you can run `project.compile()`. This method will synchronously return a unique id, which can be used to track events related to this particular compile if necessary. You must be listening for the events you are interested in **before** calling `compile` if you want to ensure that you will get all feedback.

## The Stack

This version of roots is a little more strict enforcing a default stack. However, the stack allows for quite a large amount of flexibility as both the css and js parsers are able to accept plugins. The inflexibility with regards to the stack means faster compiles and more stability. We will be using...

- [jade](http://jade-lang.com/) for markup
- [babel](https://babeljs.io/) for JS and JS transforms
- [postcss](https://github.com/postcss/postcss) for CSS transforms
- [webpack](http://webpack.github.io) as the core compiler
