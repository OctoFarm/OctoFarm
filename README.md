[comment]: <> ([![Latest Release]&#40;https://img.shields.io/github/release/octofarm/octofarm?style=for-the-badge&#41;]&#40;https://img.shields.io/github/v/tag/octofarm/octofarm?sort=date&#41;)
![Docker Pulls](https://img.shields.io/docker/pulls/octofarm/octofarm?style=for-the-badge)
![GitHub release (latest by date)](https://img.shields.io/github/downloads/octofarm/octofarm/latest/total?style=for-the-badge)
[![GitHub stars](https://img.shields.io/github/stars/octofarm/octofarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/octofarm/octofarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/network)

[![GitHub license](https://img.shields.io/github/license/octofarm/octofarm?style=for-the-badge)](https://github.com/NotExpectedYet/octofarm/blob/master/LICENSE.txt)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/octofarm/octofarm/ci?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/octofarm/octofarm?color=green&style=for-the-badge)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge)](https://GitHub.com/octofarm/octofarm/graphs/commit-activity)
[![Download Dockerhub](https://img.shields.io/badge/DOCKERHUB-OCTOFARM-<COLOR>.svg?style=for-the-badge)](https://hub.docker.com/r/octofarm/octofarm)

# OctoFarm [![Latest Release](https://img.shields.io/github/release/octofarm/octofarm)](https://img.shields.io/github/v/tag/octofarm/octofarm?sort=date)
<div align="center">
  <a href="https://github.com/NotExpectedYet/OctoFarm">
    <img src="https://github.com/OctoFarm/OctoFarm/blob/master/views/images/logo.png?raw=true" alt="Logo" width="400px">
  </a>

  <p align="center">
    OctoFarm is an easy to setup and install web server and client for unifying multiple instances of Octoprint. You can manage and monitor as many instances as you want from a single interface giving you full control over your 3D printer farm.
    <br />
    <a href="https://github.com/NotExpectedYet/OctoFarm/wiki"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/NotExpectedYet/OctoFarm/issues">OctoFarm Bug</a>
    ·
    <a href="https://github.com/OctoFarm/OctoFarm/discussions">Request Feature</a>
  </p>
</div>

## Table of Contents
- [About the Project](#about-the-project)
- [Getting Started](#getting-started)
    - [Running with docker-compose.yml](#running-with-docker-composeyml)
    - [Wiki](https://github.com/NotExpectedYet/OctoFarm/wiki/)
    - [Platform](#platform)
    - [Supported Browsers](#supported-browsers)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation-production)
    - [Installation Development](#installation-development)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## About The Project
OctoFarm was built to fill a need that anyone with multiple 3D printers with Octoprint will have run into. How do I
manage multiple printers from one place? That's where OctoFarm steps in, add your OctoPrint instances to the system and
it will scan and keep you up to date on the status of your printers.

![OctoFarm Dashboard][DashboardScreenshot]

## Getting Started
We provide many ways for you to run OctoFarm, however we do realize that some ways like using Docker can be complex or new for some users.
If that applies to your case, we offer to install NodeJS 14+ directly and to clone the source code from git (see [prerequisites](#prerequisites) below)
1) Are you new to git, github or docker?
> Make sure to install git on your system
> 
> Go for ``git clone -branch master https://github.com/OctoFarm/OctoFarm.git``

the easiest is to run our installer 

Choose freely:
- Standalone installer
  - Windows 64-bits (coming soon...)
  - Ubuntu 64-bits (coming soon...)
  - Raspberry Pi ARM64 (coming soon...)
- NodeJS v14+
  - PM2 (monitored service)
  - Nodemon (developer only)
- Docker (docker-compose below)
  - Windows 10 (we advice [WSL2](https://docs.docker.com/docker-for-windows/install/) and BIOS virtualization)
  - Ubuntu 18.04+
  - Most other 64-bits Unix systems
- (Coming soon) installation
  - Windows 10 (setup .exe)
  - Ubuntu (.deb)
  - Most Unix systems

## Running with docker-compose.yml
1) NOTE we assume you are familiar with `docker` and `docker-compose`. These are great tools for isolating your software deployment, but it can come at the cost of complexity.
We do not or cannot support each custom scenario or setup! 
Take good care of checking your device's memory limits, architecture and CPU power.
2) NOTE we provide `octofarm/octofarm:latest`, `octofarm/octofarm:alpin-latest` and `octofarm/octofarm:monolithic-latest`
   - `latest` and `alpine-latest` require you to run MongoDB or a MongoDB container (see compose below)
   - `monolithic`

### Docker images :latest or :alpine-latest with MongoDb
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
    ports:
    # SYSTEM:CONTAINER
    - 4000:4000
    environment:
    - MONGO=mongodb://MONGO_ROOTUSER_HERE:MONGO_PASSWORD_HERE@mongodb:27017/octofarm?authSource=admin
    volumes:
    # Local volumes, can be made named - not advised
    - ./OctoFarm/logs:/app/logs
    - ./OctoFarm/scripts:/app/scripts
```
### Docker image :monolithic-latest
The monolithic image does not require mongo externally, but it also has less control:
```
 octofarm-monolithic:
    container_name: octofarm-monolithic
    image: octofarm/octofarm:monolithic-latest
    restart: always
    volumes:
    # Local volumes, can be made named
    - ./OctoFarm/logs:/app/logs   
    - ./OctoFarm/scripts:/app/scripts
    - ./mongodb-data:/data/db 
    ports:
    # SYSTEM:CONTAINER
    - 4000:4000
```

## Setup version (.exe, .deb, etc.)
We are really close to providing installable versions of OctoFarm! Bear with us for version 1.1.14. We will provide the
following:
- Windows 10 (OctoFarm_setup.exe)
- Unix (OctoFarm_setup.deb)

The links to these files will be provided once available!

## OctoPrint 1.4.1+
Currently there are issues with using the Global API Key to connect to these instances of OctoPrint. Please use the
first user you setup on OctoPrint and a generated Application / User API key from this user to connect. I will be
updating OctoFarm to work better with all permission sets eventually but for now this will allow a connection to be
established.

### Platform
Confirmed working on: Linux (Ubuntu, Debian), RaspberryPi (Rasbian), Windows 10. Should also work on but not tested:
MacOS, anything else nodejs will run on.

_Note_: Raspberry Pi's Raspbian OS doesn't officially support running MongoDB yet (MongoDB requires a 64bit kernel,
whereas Raspbian's is 32bit), so in that case, you'll need a 32-bit MongoDB version, an external database running on
some other machine, or VM.

### Supported Browsers
All browsers should now be supported in OctoFarm. Please log an issue if this is not the case.

### Prerequisites
In order to have
- [MongoDB](https://www.mongodb.com/) - v3.6+
- [NodeJS](https://nodejs.org/) - v14.0.0 (Latest tested: v14.16.0)
- [NPM](https://www.npmjs.com/) - v6.10.0+ (Latest tested: v7.6.3)
- [OctoPrint](https://octoprint.org) - v1.3.9+

On your OctoPrint instance

- User Name -> User Settings
- Copy the API Key some place easy to get to
- Enabled the Allow Cross Origin Resource Sharing (CORS)
- Restart OctoPrint
- Repeat for all OctoPrints that will be added to the Farm

## See The WIKI for more detailed instructions than what's available below
### Installation

All user documentation is now moving to OctoFarm.net. Development documentation below.

https://octofarm.net

### Installation for Development

1. Clone the OctoFarm

```sh
git clone https://github.com/NotExpectedYet/OctoFarm.git
```

2. Install NPM packages

```sh
npm install
```

3. Create an .env file with the MONGO variable:

```
MONGO=mongodb://127.0.0.1:4000/octofarm
```

OR (custom parameters, like from a `docker-compose.yml` file)

```
# Docker alternative
MONGO=mongodb://mongo_compose_service_name_here:compose_exposed_port_here/octofarm
```

3b. OR **if you have a password or other different parameters** (credentials, host, port or authSource):

```
MONGO=mongodb://USERNAME:PASSWORD@HOST:PORT/octofarm?authSource=admin
```

4. Install nodemon

```sh
npm install --save-dev nodemon
```

5. Start the system

```sh
npm run dev
```
- The developer version uses nodemon for live server reloading on changes. It will output all the logs to the console.
- The developer version will skip some basic sanity checks, if your pages don't load right after server boot then it's
  because those sanity checks haven't finished.

## Contributing
Version 2.0 is underway on the `alpha-2x` branch. If anyone would like to join the fun please head over to discord with
the following link: [Discord](https://discord.gg/vjabMUn) and speak to us in Developer Discussions. Thanks!

## License
Distributed under GNU Affero General Public License v3.0. See `LICENSE` for more information.

## Contact
- Email: [Email NotExpectedYet](mailto:info@notexpectedyet.com)
- Project Link: [https://github.com/NotExpectedYet/OctoFarm](https://github.com/NotExpectedYet/OctoFarm)
- Discord: [Discord](https://discord.gg/vjabMUn)

## Acknowledgements

- [Gina Häußge](https://octoprint.org/) - Without OctoPrint none of this would be possible. Massive thanks to the work
  of Gina and everyone who helps out with that.
- All Patreon Supporters and random donations! - Big massive thanks for these, they keep me full of steak!
- [James Mackay (NotExpectedYet)](https://github.com/NotExpectedYet) - The spirit and creator of OctoFarm!
- [David Zwart (davidzwa)](https://github.com/davidzwa) - Big help for the massive push from him to get V2 underway.
  Brought a lot of knowledge to the table that I was lacking.
- The users calonmer, Insertion and noxin from my discord server! Seriously no end to my thanks for these 3.
- [Derek from 3D Printed Debris](https://www.3dprinteddebris.com/) - Massive big thanks to Derek who has donated a lot
  of time and money to the project. I don't think I'd have continued at the rate I did without his bug reports and
  support.
- [JetBrains IDE](https://www.jetbrains.com/webstorm/) - Thanks to JebBrains for allowing a free license to use with
  developing my application. Their IDE is top notch!

[DashboardScreenshot]: https://github.com/NotExpectedYet/OctoFarm/blob/master/screenshots/dashboard.png?raw=true
