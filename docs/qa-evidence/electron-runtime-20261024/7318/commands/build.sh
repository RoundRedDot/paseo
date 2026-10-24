#!/bin/zsh
set -eu
export TMPDIR="$PWD/.dev/electron-qa-evidence/tmp"
mkdir -p "$TMPDIR"
npm run build:app-deps:clean
(cd packages/app && PASEO_WEB_PLATFORM=electron ../../node_modules/.bin/expo export --platform web --clear)
npm run build:server:clean
npm run build:main --workspace=@getpaseo/desktop
CSC_IDENTITY_AUTO_DISCOVERY=false npm exec --workspace=@getpaseo/desktop -- electron-builder --config electron-builder.yml --mac --arm64 --dir --publish never -c.mac.identity=null -c.mac.notarize=false
GOMAXPROCS=2 npm run typecheck > .dev/electron-qa-evidence/typecheck.log 2>&1
npm run lint > .dev/electron-qa-evidence/lint.log 2>&1
(cd packages/plugin && npx vitest run src/boundaries.test.ts --bail=1 --maxWorkers=1) > .dev/electron-qa-evidence/sdk-boundaries.log 2>&1
(cd packages/app && npx vitest run src/plugins/timeline/view.test.tsx --bail=1 --maxWorkers=1) > .dev/electron-qa-evidence/timeline-view.log 2>&1
