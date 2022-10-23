#!/bin/bash
PACKAGE_VERSION=$(cat package.json|grep version|head -1|awk -F: '{ print $2 }'|sed 's/[", ]//g')

echo "OctoFarm Packaging Version: creating a release zip at path: $PWD/octofarm-${PACKAGE_VERSION}.zip"

zip -r "octofarm-${PACKAGE_VERSION}.zip" server -x server/node_modules/**\*

echo "OctoFarm Packaging: done creating release $PWD/octofarm${PACKAGE_VERSION}.zip package!"