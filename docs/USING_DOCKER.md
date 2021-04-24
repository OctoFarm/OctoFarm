## Running OctoFarm with docker-compose.yml

Docker is a great tool! Using `docker-compose` is better and `portainer` is most awesome! Please read the following before continuing:
1) NOTE we assume you are familiar with `docker` and `docker-compose`. These are great tools for isolating your software deployment (+), but it be quite new to some users (-).
    - We cannot support each custom scenario or setup!
    - Take good care of checking your device's memory limits, architecture and CPU power (`docker stats` and for example `mem_limit: 400m` for 400MB limit in docker-compose)
    - If your device's CPU hits high percentages a lot or memory usage is high, please check your OctoFarm network timeout settings and inspect your OctoPrint/network latencies. 
2) NOTE we provide `octofarm/octofarm:latest`, `octofarm/octofarm:alpine-latest` and `octofarm/octofarm:monolithic-latest`
    - `latest` and `alpine-latest` require you to run MongoDB or a MongoDB container (see compose below)
    - `monolithic` does not require a separate MongoDB, but we at OctoFarm personally like MongoDB to be separate (docker = isolation remember?).

### Docker images 'latest' or ':'alpine-latest' with separate MongoDb
**Pay good attention that you have to configure your root-user's username and password for MongoDB and that OctoFarm needs it to work!**

Replace the values for `MONGO_ROOTUSER_HERE`, `MONGO_PASSWORD_HERE` below!
We don't advise using MongoDB without username/password, although you can do so by removing the environment variables for MongoDB and OctoFarm. IF and ONLY IF you dont want a username/password, make sure that the URL makes sense in that **special** case: `MONGO= mongodb://mongo:27017/octofarm`.

Why the MongoDB `?authSource=admin` addition, you might ask? Just to make sure the right table is checked for the username you setup, if that's the case. This table is named `admin` by default. Glad you asked!

```
# Just pick a compose spec version >3
version: '3.4' 

# (Optional) named database volume (uncomment in case you dont want a local database volume folder, see below)
# volumes:
#   mongodb-data:

services:
  mongodb:
    image: mongo:latest
    container_name: mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: MONGO_ROOTUSER_HERE
      MONGO_INITDB_ROOT_PASSWORD: MONGO_PASSWORD_HERE
      MONGO_INITDB_DATABASE: octofarm
    ports:
     # HOST:CONTAINER
    - 27017:27017
    volumes:
    # Local volume (change to mongodb-data for a named volume folder)
    - ./mongodb-data:/data/db
    restart: unless_stopped

  octofarm:
    container_name: octofarm
    # choose octofarm/octofarm:latest or octofarm/octofarm:alpine-latest    
    image: octofarm/octofarm:latest
    restart: always
    mem_limit: 400m # Feel free to adjust! 400 MB is quite high and a safety limit.
    ports:
    - 4000:4000 # port of SYSTEM : port of CONTAINER
    environment:
    - MONGO=mongodb://MONGO_ROOTUSER_HERE:MONGO_PASSWORD_HERE@mongodb:27017/octofarm?authSource=admin
    volumes:
    # Volumes as local relative folders (validate with 'docker-compose config')
    - ./OctoFarm/logs:/app/logs
    - ./OctoFarm/scripts:/app/scripts
    - ./OctoFarm/images:/app/images
```
### Docker image 'monolithic-latest'
The monolithic image does not require MongoDB externally, but it also has less control over MongoDB setup:
```
 octofarm-monolithic:
    container_name: octofarm-monolithic
    image: octofarm/octofarm:monolithic-latest
    restart: always
    volumes:
    # Local volumes, can be made named
    - ./OctoFarm/logs:/app/logs   
    - ./OctoFarm/scripts:/app/scripts
    - ./OctoFarm/images:/app/images
    - ./mongodb-data:/data/db 
    ports:
    # SYSTEM:CONTAINER
    - 4000:4000
```
### Directly use Docker without those magic compose files! 
https://octofarm.net/installation (head to the Docker section) is your friend as we covered it there already.

### Docker or docker-compose for version 2.0 (not released yet!)
In version 2.0 we will stop using MongoDB and move to a much simpler database called SQLite. This means that you won't have to do anything and you can remove your MongoDB database!
Of course we will provide the tools to hop on to the 2.0 train, when the time comes. The only change is that the `monolithic-latest` will become the same as the `latest` image. Less setup, nice ey?

Enjoy using OctoFarm with docker and do share your big-flex juicy pics on [Our Discord](https://discord.gg/vjabMUn).
