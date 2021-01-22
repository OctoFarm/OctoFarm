builddir=.build
cachedir=.cache
platforms?="linux/arm/v7,linux/arm/v6,linux/arm64,linux/amd64,linux/i386"

build:
	mkdir -p ${cachedir} ${builddir}
	docker buildx build \
	--platform ${platforms} \
	--cache-from type=local,src=${cachedir} \
	--cache-from type=registry,ref=docker.io/growlab/octofarm:latest \
	--output type=local,dest=${builddir} \
	--cache-to type=local,dest=${cachedir} \
	--progress tty -t growlab/octofarm -f alpine.Dockerfile .

push:
	docker buildx build -t growlab/octofarm -f alpine.Dockerfile . \
	--push \
	--platform ${platforms} \
	--cache-from type=local,src=${cachedir}

clean:
	rm -rf .build/ && rm -rf .cache/

all:
	make build && make push