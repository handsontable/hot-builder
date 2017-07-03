#!/bin/bash

INFO='\033[1;31m'
DONE='\033[0;32m'
NC='\033[0m'

echo -e "${INFO}*** Clonning the Handsontable repository ***${NC}"

git clone https://github.com/handsontable/handsontable.git

echo -e "${DONE}*** Done ***${NC}"
echo -e "${INFO}*** Installing all necessary dependencies via 'npm install' ***${NC}"

cd handsontable/
npm install
cd ..

echo -e "${INFO}*** Building Handsontable using 'hot-builder' ***${NC}"
echo -e "${DONE}*** Done ***${NC}"

node src/main.js build -i handsontable/ -o handsontable_dist/ -a -U --quiet

echo -e "${INFO}*** Checking differences between generated distributed files ***${NC}"
echo -e "${DONE}*** Done ***${NC}"

diff --suppress-common-lines -y handsontable/dist/handsontable.js handsontable_dist/handsontable.js

echo -e "${DONE}*** Done ***${NC}"
