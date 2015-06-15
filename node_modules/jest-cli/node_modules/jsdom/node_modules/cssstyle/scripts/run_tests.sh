#!/bin/sh

node ./scripts/generate_properties.js
nodeunit tests
