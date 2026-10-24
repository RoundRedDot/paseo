#!/bin/zsh
set -eu
CSC_IDENTITY_AUTO_DISCOVERY=false npm exec --workspace=@getpaseo/desktop -- electron-builder --config electron-builder.yml --mac --arm64 --dir --publish never -c.mac.identity=715F3345FF5B6594F0A46F830BEC540487202B37 -c.mac.notarize=false
node .dev/electron-qa-evidence/receipt.cjs
node .dev/electron-qa-evidence/run-packaged.cjs 7318
