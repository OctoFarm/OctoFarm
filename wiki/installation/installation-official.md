# OctoFarm Official (MongoDB Optional)

BIG thanks to knoker for the help with this!

```
docker run -d --name octofarm -e "MONGO=mongodb://172.17.0.2/octofarm" -p4000:4000 octofarm/octofarm -e "TZ=America/Chicago" -v '<your persistent folder>/OctoFarm/config/':'/app/serverConfig/':'rw' -v '<your persistent folder>/OctoFarm/logs/':'/app/logs/':'rw'
```

Environment Variables

- MONGO = contains mongodb connection string
- TZ = local timezone code e.g. "America/Chicago" Database of TimeZone Values Here

Ports

- 4000

Paths

```
- <your persistent folder>/OctoFarm/config/':'/app/serverConfig/
- <your persistent folder>/OctoFarm/logs/':'/app/logs/
```

## Generic Docker-Compose Installation (Includes a MongoDB Server)

```
version: "3"
services:
  mongo:
    image: mongo
    restart: always
    volumes:
      - <your persistent folder>/MongoDB:/data/db

  octofarm:
    container_name: octofarm
    image: octofarm/octofarm
    restart: always
    ports:
      - 4000:4000
    environment:
      - MONGO=mongodb://mongo/octofarm
    volumes:
      - <your persistent folder>/OctoFarm/config:/app/serverConfig
      - <your persistent folder>/OctoFarm/logs:/app/logs
```

## Windows Specific Docker-Compose Installation (Includes a MongoDB Server)

- NOTE: Docker Dashboard -> Settings -> Resources -> File Sharing -> check the C drive (or wherever you want persistent storage to be)

```
version: "3.1"

services:
  mongo:
    image: mongo
    restart: always

  octofarm:
    image: octofarm/octofarm
    restart: always
    ports:
      - 4000:4000
    environment:
      - MONGO=mongodb://mongo/octofarm
    volumes:
      - /c/ProgramData/OctoFarm/serverConfig:/app/serverConfig
      - /c/ProgramData/OctoFarm/logs:/app/logs
```
