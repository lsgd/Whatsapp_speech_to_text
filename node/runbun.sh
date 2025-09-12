#!/bin/env sh
export CHROMIUM_PATH=$(which chromium)
chromium
bun index.js
