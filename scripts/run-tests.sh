#!/bin/bash

INFO='\033[1;33m'
DONE='\033[0;32m'
NC='\033[0m'

echo -e "${INFO}*** Cloning the Handsontable repository (the ${HOT_BRANCH} branch) ***${NC}"

git clone -b $HOT_BRANCH https://github.com/handsontable/handsontable.git
# Remove the 'dist' directory to make sure that the following directory will only contain only newly generated files by the 'hot-builder'.
rm -r handsontable/dist

echo -e "${INFO}*** Installing all necessary dependencies via 'npm install' ***${NC}"

cd handsontable/
npm install
cd ..

echo -e "${INFO}*** Building Handsontable using 'hot-builder' ***${NC}"

# Overwrite handsontable/dist files with this newle generated.
node src/main.js build -i handsontable/ -o handsontable/dist -a -U --quiet

echo -e "${INFO}*** Testing Handsontable generated package using regular Handsontable tests ***${NC}"

cd handsontable/
npm run test:e2e.dump
./node_modules/.bin/grunt test-handsontable
