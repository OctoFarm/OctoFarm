echo "Running build sequence for Version: $VERSION"
## BUILD CLIENT FROM SOURCE FILES
chmod +x scripts/build-client-from-source.sh
scripts/build-client-from-source.sh
### CREATE RELEASE ZIP
chmod +x scripts/create-release-zip.sh $VERSION
scripts/create-release-zip.sh
## BUILD DOCKER IMAGES
chmod +x scripts/build-docker-images.sh
scripts/build-docker-images.sh
echo "Build sequence complete, continuing with rest of release..."