# hot-builder  [![Build Status](https://travis-ci.org/handsontable/hot-builder.png?branch=master)](https://travis-ci.org/handsontable/hot-builder) [![hot-builder](https://img.shields.io/npm/v/hot-builder.svg)](https://www.npmjs.com/package/hot-builder)
A CLI tool for building custom [Handsontable](https://github.com/handsontable/handsontable/) spreadsheet component.

## Table of contents
1. [Installation](#installation)
2. [Basic usage](#basic-usage)
4. [Examples](#examples)
5. [License](#license)
6. [Contact](#contact)

## Installation

Install the tool using [npm](https://npmjs.com/).

```sh
npm install hot-builder -g
```

## Basic usage

##### ```> hot-builder build```

Builds custom version of handsontable.

Arguments:
- ```-i, --input``` - Path to a directory where Handsontable Community Edition or Handsontable PRO repository was downloaded.
- ```-o, --output-dir``` - Output directory where generated bundle will be saved.
- ```-a, --include-all``` - Includes all found modules into generated bundle.
- ```-A, --add-module``` - Includes specified modules into generated bundle (eg. `-A ContextMenu,ManualRowMove`).
- ```-R, --remove-module``` - Excludes specified modules from generated bundle (eg. `-R ContextMenu,ManualRowMove`).
- ```-U, --no-ui``` - Disables the UI.
- ```--repository-tag``` - Specifies which version of Handsontable Community Edition or Handsontable PRO repository will be cloned (eg. `--repository-tag develop`, or `--repository-tag 0.32.0`). This option is active only if you omitted `-i`, `--input` argument.
- ```--debug``` - Debug mode - will output debug messages from workers.

##### ```> hot-builder -h```

Displays `hot-builder` help information.

##### ```> hot-builder -V```

Prints the installed `hot-builder` version.

## Examples

Build your custom handsontable Community Edition package (from the handsontable remote repository)

```sh
$ hot-builder build -o hot-dist
```

Or build your custom handsontable Community Edition package using a local directory

```sh
$ hot-builder build -i path-to-your-handsontable-copy/ -o hot-dist
```

After executing command and selecting plugins, the builder automatically resolves all plugins and external libraries before building a package in the `hot-dist` directory.

If it works correctly, you should see something like:

![hot-builder #1](https://i.imgur.com/huCCrWj.png)
![hot-builder #1](https://i.imgur.com/B7xwiLy.png)

Additional examples:

- [Building Handsontable Community Edition package from the remote repository](https://asciinema.org/a/117465)
- [Building Handsontable Community Edition package from a local directory](https://asciinema.org/a/117464)
- [Building Handsontable PRO package from the remote repository](https://asciinema.org/a/117462)
- [Building Handsontable Community Edition package with specified plugins only](https://asciinema.org/a/117466)

## License
`hot-builder` is released under the [MIT license](https://github.com/handsontable/hot-builder/blob/master/LICENSE).
Copyrights belong to Handsoncode sp. z o.o.

## Contact
Feel free to give us feedback on this tool using this [contact form](https://handsontable.com/contact.html) or write directly at hello@handsontable.com.
