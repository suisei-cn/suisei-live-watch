#!/bin/bash
set -e
node_modules/.bin/mocha test --exit
node_modules/.bin/mocha test/spt_pshb.js --exit