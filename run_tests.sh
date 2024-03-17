#!/bin/bash -e


COVERAGE_DIR=./tests/coverage
rm -rf $COVERAGE_DIR

./deno.sh check main.ts
./deno.sh check src/frontend/index.tsx

./deno.sh test                    \
    --no-prompt                   \
    --ignore=base/tests/*         \
    --cached-only                 \
    --coverage=$COVERAGE_DIR/raw  \
    ${@:-tests/}


./deno.sh coverage --html $COVERAGE_DIR/raw
mv $COVERAGE_DIR/raw/html $COVERAGE_DIR/html

