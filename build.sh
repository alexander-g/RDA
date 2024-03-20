#!/bin/bash -ex

if [[ `uname` == *"MINGW"* || `uname` == *"MSYS"* ]] then
    DENO="./deno.bat"
else
    DENO="./deno.sh"
fi

$DENO task cache
./main.ts --compile-only
$DENO compile          \
    --output=main      \
    --cached-only      \
    --no-prompt        \
    --unstable         \
    --allow-ffi        \
    --allow-net=0.0.0.0:5050,download.pytorch.org,github.com,objects.githubusercontent.com \
    --allow-read=./    \
    --allow-write=./   \
    --allow-run=xdg-open,cmd.exe \
     main.ts             \
     --no-devmode
