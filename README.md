# hot-builder  [![Build Status](https://travis-ci.org/handsontable/hot-builder.png?branch=master)](https://travis-ci.org/handsontable/hot-builer)
A CLI tool for building custom [Handsontable](https://github.com/handsontable/handsontable) spreadsheet component.

## Table of contents
1. [Installation](#installation)
2. [Basic usage](#basic-usage)
4. [Examples](#examples)
5. [License](#license)
6. [Contact](#contact)

## Installation

Install the component using ["NPM"](http://npmjs.com/).

```sh
npm install hot-builder -g
```

## Basic usage

##### ```> hot-builder build```

Build custom version of handsontable.

Arguments:
- ```-i, --input``` - Path to directory where Handsontable CE or Handsontable PRO repository was downloaded.
- ```-o, --output-dir``` - Output directory where generated bundle will be saved.
- ```-a, --include-all``` - Include all found modules into generated bundle.
- ```-A, --add-module``` - Include specified modules into generated bundle (eg. `-A ContextMenu,ManualRowMove`).
- ```-R, --remove-module``` - Exclude specified modules from generated bundle (eg. `-R ContextMenu,ManualRowMove`).
- ```-U, --no-ui``` - Disables UI.
- ```--repository-tag``` - Specifies what version of Handsontable CE or Handsontable PRO repository will be cloned (eg. `--repository-tag develop`, or `--repository-tag 0.32.0`). This option is active only if you omitted `-i`, `--input` argument.
- ```--pro``` - Indicates that version specified by `--repository-tag` argument will be referred to Handsontable PRO package.
- ```--debug``` - Debug mode - will output debug messages from workers.

##### ```> hot-builder -h```

Display `hot-builder` usage help.

##### ```> hot-builder -V```

Print the `hot-builder` installed version.

## Examples

Build your custom handsontable package (from handsontable repository)

```sh
$ hot-builder build -o hot-dist
```

Or build your custom handsontable package (from your handsontable repository)

```sh
$ hot-builder build -i path-to-your-handsontable-copy/ -o hot-dist
```

After executing command and selecting plugins builder automatically resolve all plugins and external libraries dependencies and build package in `hot-dist` directory.

If it works correctly, you should see something like:

[![asciicast](https://asciinema.org/a/117461.png)](https://asciinema.org/a/117461)

- [Simple react-handsontable implementation](http://codepen.io/handsoncode/pen/ygvaxv?editors=0010)
- [Simple react-handsontable implementation with a single-property configuration](http://codepen.io/handsoncode/pen/pRamwZ?editors=0010)
- [Interactive HotTable demo](http://codepen.io/handsoncode/pen/zNRoxb?editors=0010)

## License
`hot-builder` is released under the [MIT license](https://github.com/handsontable/hot-builder/blob/master/LICENSE).
Copyrights belong to Handsoncode sp. z o.o.

## Contact
Feel free to give us feedback on this tool using this [contact form](https://handsontable.com/contact.html) or write directly at hello@handsontable.com.
