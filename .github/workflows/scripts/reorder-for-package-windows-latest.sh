#!/bin/bash -xe

#debug
pwd

mkdir -p package && cd package
pwd
ls ..

cp -r ../artifacts/ui-build/static ./static

mkdir -p ./assets
cp ../artifacts/ui-build/main.exe ./assets/
../repo/deno.bat run \
    --allow-read=../                              \
    --allow-write=./                              \
    ../repo/base/backend/ts/crypto.ts             \
    ../artifacts/binaries/Release/TSinterface.dll \
    ./assets/TSinterface.dll.enc

mkdir -p models
cp ../artifacts/ui-build/models/models.json ./models/

cp ../repo/.github/workflows/scripts/main.bat ./

#debug 
ls -R
