#!/bin/bash

echo "OctoFarm Packaging: creating a release zip at path: $PWD/octofarm-$1.zip"

zip -r "octofarm-$1.zip" server

echo "OctoFarm Packaging: done creating release $PWD/octofarm-$1.zip package!"