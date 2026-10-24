#!/bin/zsh
set -eu
export TMPDIR="$PWD/.dev/electron-qa-evidence/tmp"
mkdir -p "$TMPDIR"
npm run build:app-deps:clean
(cd packages/app && PASEO_WEB_PLATFORM=electron ../../node_modules/.bin/expo export --platform web --clear --max-workers 2)
npm run build:server:clean
npm run build:main --workspace=@getpaseo/desktop
CSC_IDENTITY_AUTO_DISCOVERY=false npm exec --workspace=@getpaseo/desktop -- electron-builder --config "$PWD/.dev/electron-qa-evidence/qa-builder.json" --mac --arm64 --dir --publish never
