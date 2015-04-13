# hot-builder
CLI tool for building custom [handsontable](https://github.com/handsontable/handsontable) package

## Install

Install the component using [NPM](http://npmjs.com/):

```sh
$ npm install hot-builder -g
```

## Example

Build your custom handsontable package (from oryginal handsontable repository)

```sh
$ hot-builder build --output hot-dist
```

Or build your custom handsontable package (from your handsontable repository)

```sh
$ hot-builder build --input your-handsontable/package.json --output hot-dist
```

After executing command and selecting plugins builder automatically resolve all plugins and external libraries dependencies and build package in `hot-dist` directory. 

## Usage

#### build

Build custom version of handsontable.

- ```--input, -i``` - Input package.json file (default entry point is Handsontable which is added as dependency to hot-builder - `node_modules/handsontable/package.json`).
- ```--output-dir, -o``` - Output directory.
- ```--all, -a``` - If exists it includes by default all found modules.
- ```--add-module``` - Adds specified module to build package (eg. `--add-module=ContextMenu,AutocompleteEditor` or `--add-module=ContextMenu --add-module=AutocompleteEditor`).
- ```--remove-module``` - Removes specified module from build package (eg. `--remove-module=ContextMenu,AutocompleteEditor` or `--remove-module=ContextMenu --remove-module=AutocompleteEditor`).
- ```--disable-ui, -D``` - Disable UI.

#### help

Display `hot-builder` help.

#### version

Print the `hot-builder` version.

## License

[MIT License](http://opensource.org/licenses/MIT)
