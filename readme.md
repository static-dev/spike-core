# Spike Core

[![version](https://img.shields.io/npm/v/spike-core.svg?style=flat)](https://www.npmjs.com/package/spike-core) [![tests](http://img.shields.io/travis/static-dev/spike-core/master.svg?style=flat)](https://travis-ci.org/static-dev/spike-core) [![dependencies](http://img.shields.io/david/static-dev/spike-core.svg?style=flat)](https://david-dm.org/static-dev/spike-core) [![coverage](https://img.shields.io/coveralls/static-dev/spike-core.svg?style=flat)](https://coveralls.io/github/static-dev/spike-core?branch=master) [![chat](https://img.shields.io/gitter/room/static-dev/spike.svg)](http://gitter.im/static-dev/spike)

An opinionated static build tool, powered by [webpack](http://webpack.github.io)

## Why should you care?

[We](https://github.com/carrot) [:heart:](http://giphy.com/gifs/steve-carell-cute-the-office-Yb8ebQV8Ua2Y0/tile) [static](https://www.smashingmagazine.com/2015/11/modern-static-website-generators-next-big-thing/).

If you're building a website or client-side app – then :cactus: spike is probably for you. Spike aims to be simple, efficient, and a pleasure to use.

Spike certainly is not the only [static site generator](https://www.staticgen.com/) out there, but in our opinion, it's the most powerful and easiest to use.

> Spike is from the same [team](https://github.com/carrot) that brought you [Roots](http://roots.cx). The thinking behind moving past Roots is explained in [this article](https://medium.com/@jescalan/eaa10c75eb22). Please feel free to comment and contribute.

### The Stack

Spike is fairly strict in enforcing a default stack. However, the stack allows for quite a large amount of flexibility as all of the parsers are simply foundations that do nothing by default and accept plugins to transform code. Also spike's core compiler is [Webpack](https://github.com/webpack/webpack), so you can customize your project with [loaders](https://webpack.github.io/docs/loaders.html) and [plugins](https://webpack.github.io/docs/plugins.html). The inflexibility of the stack means faster compiles and better stability. We use...

- [reshape](https://github.com/reshape/reshape) for markup
- [babel](https://babeljs.io/) for JS and JS transforms
- [postcss](https://github.com/postcss/postcss) for CSS transforms
- [webpack](http://webpack.github.io) as the core compiler

### Features

- Easy configuration via the `app.js` file
- Integration with [Webpack's](https://github.com/webpack/webpack) massive plugin/loader ecosystem
- Support for ES6 in your client-side JS via Babel
- PostCSS default means extensive flexibility in CSS syntax and tools
- Reshape default means the same for your HTML
- Breezy local development powered by [Browsersync](https://browsersync.io/)
- Selective compile in `watch` mode :zap:
- Support for [multiple environments](https://spike.readme.io/docs/environments)
- Interactive Project Starters via [sprout](https://github.com/carrot/sprout)
- [Spike Plugins](https://npms.io/search?term=spikeplugin) for common integrations

## Installation

- `npm install spike-core -S`

## Usage

Spike operates through a carefully crafted javascript interface. If you are looking to use spike through its command line interface, check out [spike](https://github.com/static-dev/spike). This project is just the core javascript API.

[**Check out the documentation for the Javascript API here**](https://spike.readme.io/docs/javascript-api)
