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
    OctoFarm is an easy to setup and install web server and client for unifying multiple instances of Octoprint. <br/>You can manage and monitor as many instances as you want from a single interface giving you full control over your 3D printer farm.
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
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## About The Project
OctoFarm was built to fill a need that anyone with multiple 3D printers with Octoprint will have run into. How do I
manage multiple printers from one place? That's where OctoFarm steps in, add your OctoPrint instances to the system and
it will scan and keep you up to date on the status of your printers.

![OctoFarm Dashboard][DashboardScreenshot]

## Prerequisites

In order to have OctoFarm running using a local installation of NodeJS and MongoDB as database, please be aware of the following minimum version requirements:
- [MongoDB](https://www.mongodb.com/) - v3.6+ (Latest test: V4.4)
- [NodeJS](https://nodejs.org/) - v14.0.0 (Latest tested: v14.16.1)
- [NPM](https://www.npmjs.com/) - v6.10.0+ (Latest tested: v7.17.0)
- [OctoPrint](https://octoprint.org) - v1.4.2+

### OS / Platform for OctoFarm
Confirmed working on:
- Windows 10/11 (direct or with chocolatey)
> Find the chocolatey package here: https://community.chocolatey.org/packages/octofarm 
> This will install all dependencies NodeJS, MongoDB and OctoFarm with pm2  
- Linux (Ubuntu, Debian)
- FarmPi (Raspberry Pi 3A+ or newer)
> Find the FarmPi image for Raspberry Pi 3A+ or newer here: https://github.com/mkevenaar/FarmPi

Should also work on but not tested:
- MacOS
- _Anything else NodeJS 14+ will run on._

Avoid the following, known to be tough to get working: 
- Raspberry Pi OS - go for the **FarmPi Ubuntu** image instead (https://github.com/mkevenaar/FarmPi/releases/latest)!

_Note_: Raspberry Pi's OS must be the 64-bit version to work. Both the docker containers as well as direct install is hard to get working. The docker containers seem to fail on wrong architecture and direct install fails on a 64 bits MongoDB requirement. 

### Important note OctoPrint 1.4.1+

<span style="color:red">Do not use the **Global API Key!**</span><br/>
<span style="color:lime">Generate an **Application** or **User API Key!**</span><br/>

OctoPrint WebSocket connection **will fail** when providing the **Global API** Key and **OctoFarm will therefore not accept this type of OctoPrint key**. You must generate an **Application Key** or **User API key** from your OctoPrint account. Your logged in user requires the groups **Admin** and **Operator** (or simply all permissions), or we cannot guarantee a 100% succesful OctoFarm experience.

### Preparing OctoPrint User API Key / Application Key

Follow all these steps **on the specific OctoPrint website**:
- User Name -> User Settings
- Copy the **User API Key** (or alternatively **Application Key** in System Settings, **but never the Global API Key!**)
- Enable the Allow Cross Origin Resource Sharing (CORS) setting
- Restart OctoPrint
- Repeat for all OctoPrints that will be added to the Farm

## Getting Started
Please choose the direct NodeJS installation or the Docker image.
1) Installing OctoFarm - read the following: [OctoFarm.net installation instructions](https://octofarm.net/installation) 
2) Docker image(s) [docker or docker-compose usage instructions](./docs/USING_DOCKER.md)
3) Installation for Development (Node 14+, Nodemon)

### Development Installation for the server.
_This is for devs or testers only! It is not practical to use `nodemon` for normal usage as `nodemon` does not add a service like `pm2` (option 1) or `docker` (option 1 and 2). Please, if you are a normal user, check out [OctoFarm.net installation instructions](https://octofarm.net/installation) instead!_

1. Clone the OctoFarm

```sh
git clone https://github.com/NotExpectedYet/OctoFarm.git
```

2. Install NPM packages

```sh
npm install
```

3. Start the server

```sh
npm run dev
```
- The developer version uses nodemon for live server reloading on changes. It will output all the logs to the console.
- The developer version will skip some basic sanity checks, if your pages don't load right after server boot then it's
  because those sanity checks haven't finished.

### Development Installation for the client.
_If your making changes to the client then you will need to build this manually._

1. cd into the "client_src" folder.

```sh
cd client_src
```

2. Start the client development file watcher
```sh
npm run dev
```

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
- [Derek from 3D Printed Debris](https://www.3dprinteddebris.com/) - Massive big thanks to Derek who has donated a lot
  of time and money to the project. I don't think I'd have continued at the rate I did without his bug reports and
  support.
- [JetBrains IDE](https://www.jetbrains.com/webstorm/) - Thanks to JebBrains for allowing a free license to use with
  developing my application. Their IDE is top notch!

[DashboardScreenshot]: https://github.com/NotExpectedYet/OctoFarm/blob/master/screenshots/dashboard.png?raw=true
