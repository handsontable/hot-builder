#!/bin/bash

git clone https://github.com/handsontable/handsontable.git
cd handsontable/
npm install
cd ..

node src/main.js build -i handsontable/ -o handsontable_dist/ -a -U
