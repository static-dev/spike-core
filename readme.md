# Roots Mini

Experimenting with a new [webpack](http://webpack.github.io) core for roots.

### Why should you care?

The thinking behind this experiment is explained in [this article](https://medium.com/@jescalan/eaa10c75eb22). Please feel free to comment and contribute.

### Setup

- Make sure you have an [editorconfig plugin](http://editorconfig.org/#download) installed for your text editor
- Make sure you have a [standard js linter](http://standardjs.com/index.html#usage) installed, tests will not pass if linting fails
- Make sure you are familiar with [ES6](https://medium.com/sons-of-javascript/javascript-an-introduction-to-es6-1819d0d89a0f)
- Make sure you are familiar with [test-driven development](https://www.wikiwand.com/en/Test-driven_development)

### Usage

Roots can operate through either a javascript API or a CLI interface. At the moment, only the JS API is being developed, the CLI will come later on once the project is closer to complete.

The Roots module exposes a single class through which all functionality operates. An instance of the class should be created for each project being compiled with Roots.

```js
import Roots from 'roots'

let project = new Roots({ root: 'path/to/project/root' })
```

The above shows a minimal instantiation, but the constructor accepts a wide variety of options, listed below.

##### Roots Constructor Options

- **root**: An absolute path to the root of your project.
- **matchers**: An object with `jade`, `css`, and `js` keys. Each key is a [micromatch](https://github.com/jonschlinkert/micromatch) string, and represents which files should be pulled into the pipeline to be processed. Defaults are `**/*.jade`, `**/*.css`, and `**/*.js`. Be very careful if you are trying to change this.
- **postCssPlugins**: An array of [plugins to be passed to PostCSS](http://postcss.parts/) for CSS processing.
- **babelConfig**: A [configuration object for Babel](http://babeljs.io/docs/usage/options/) for JS processing.
- **bundleName**: The name of your resulting js bundle from webpack. Defaults to `bundle.js`.
- **dumpDirs**: An array of directories which, if direct children of the project root, will dump their contents to the root on compile. Defaults to `['views', 'assets']`.

Roots exposes a simpler and more straightforward configuration interface than if you were to set up the webpack configuration yourself. However, if you'd like to directly edit the webpack config, you can still do this after the project has been instantiated through the `config` property on each instance.

```js
let project = new Roots({ root: 'path/to/project/root' })
console.log(project.config) // echoes bare webpack config object, can be edited
```

If you decide to edit the webpack config object directly, *be careful*. It is easy to break the way roots works without knowing exactly what you are doing here. If there's something you are looking to customize that is not part of roots' options, it's better to open an issue and ask for it to be made customizable, then we'll get you a much cleaner way to do it!

### The Stack

This version of roots is a little more strict enforcing a default stack. However, the stack allows for quite a large amount of flexibility as both the css and js parsers are able to accept plugins. The inflexibility with regards to the stack means faster compiles and more stability. We will be using...

- [jade](http://jade-lang.com/) for markup
- [babel](https://babeljs.io/) for JS and JS transforms
- [postcss](https://github.com/postcss/postcss) for CSS transforms
- [webpack](http://webpack.github.io) as the core compiler
