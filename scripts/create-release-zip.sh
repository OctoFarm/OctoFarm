#!/bin/bash

echo "OctoFarm Packaging: creating a release zip at path: $PWD/octofarm.zip"

zip -r octofarm.zip server

echo "OctoFarm Packaging: done creating release $PWD/octofarm.zip package!"