# Roots Mini

Experimenting with a new [webpack](http://webpack.github.io) core for roots.

### Why should you care?

The thinking behind this experiment is explained in [this article](https://medium.com/@jescalan/eaa10c75eb22). Please feel free to comment and contribute.

### Setup

- Make sure you have an [editorconfig plugin]() installed for your text editor
- Make sure you have a [standard js linter]() installed, tests will not pass if linting fails
- Make sure you are familiar with [ES6]()
- Make sure you are familiar with [test-driven development]()

### Usage

To run the tests, `npm test` from the command line. This project is developed exclusively through tests.

### The Stack

This version of roots is a little more strict enforcing a default stack. However, the stack allows for quite a large amount of flexibility as both the css and js parsers are able to accept plugins. The inflexibility with regards to the stack means faster compiles and more stability. We will be using...

- [jade](http://jade-lang.com/) for markup
- [babel](https://babeljs.io/) for JS and JS transforms
- [postcss](https://github.com/postcss/postcss) for CSS transforms
- [webpack](http://webpack.github.io) as the core compiler
