This is my currently fork build of this awesome app. I assume that these are some improvements that would be nice to be developed over the main images, i.e:

- run as non-root user
- PID1 entrypoint (_tini_)
- multi-stage builds

Since someone can use mongoDb Atlas as a service, i've tried to compile an lean image that works with several architectures, including `amd64`:

- armhf
- aarch64
- i386

Were sucessfuly tested on RPi B v1.2 and RPi 4. Weights less than **180Mb**, user-ready deployment. The image uses _NodeJS v12.20.1 and NPM v6.14.10_

@NotExpectedYet, please consider at least to accept the **.dockerignore**. OctoFarm official images are full of `.git` nonsense making the final image size quite bigger.
`# du -h /app` outputs from `octofarm/octofarm:latest`,
