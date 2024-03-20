#!/bin/bash -ex

./deno.sh compile      \
    --output=main      \
    --cached-only      \
    --no-prompt        \
    --unstable         \
    --allow-ffi        \
    --allow-net=0.0.0.0:5050,download.pytorch.org \
    --allow-read=./    \
    --allow-write=./   \
     main.ts             \
     --no-recompile
