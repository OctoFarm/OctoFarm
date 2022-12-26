echo "Building main docker image, this may take a while..."
docker build -t `octofarm/octofarm:latest` . -f main.Dockerfile
echo "Build monolithic docker image, this may also take a while..."
docker build -t `octofarm/octofarm:latest` . -f monolithic.Dockerfile