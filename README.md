<!-- PROJECT LOGO -->

[![GitHub issues](https://img.shields.io/github/issues/NotExpectedYet/OctoFarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/issues)
[![GitHub forks](https://img.shields.io/github/forks/NotExpectedYet/OctoFarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/network)
[![GitHub stars](https://img.shields.io/github/stars/NotExpectedYet/OctoFarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/stargazers)
[![GitHub license](https://img.shields.io/github/license/NotExpectedYet/OctoFarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/blob/master/LICENSE.txt)

<h3 align="center">Current Feature Requests</h3>

[![Feature Requests](https://feathub.com/NotExpectedYet/OctoFarm?format=svg)](https://feathub.com/NotExpectedYet/OctoFarm)

  <p>Please visit <a href="https://feathub.com/NotExpectedYet/OctoFarm">to log a request.</a>

  <h3 align="center">Version 1.1.2 - BETA</h3>
<br />
<p align="center">
  <a href="https://github.com/NotExpectedYet/OctoFarm">
    <img src="views/images/logo.png" alt="Logo" width="60%">
  </a>

  <h3 align="center">OctoFarm</h3>

  <p align="center">
    OctoFarm is an easy to setup and install web server and client for unifying multiple instances of Octoprint. You can manage and monitor as many instances as you want from a single interface giving you full control over your 3D printer farm.
    <br />
    <a href="https://github.com/NotExpectedYet/OctoFarm/wiki"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/NotExpectedYet/OctoFarm/issues">OctoFarm Bug</a>
    ·
    <a href="https://feathub.com/NotExpectedYet/OctoFarm">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->

## Table of Contents

- [About the Project](#about-the-project)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation Docker](#installation-Docker)
  - [Installation Production](#installation-Production)
  - [Installation Development](#installation-Development)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

<!-- ABOUT THE PROJECT -->

## About The Project

OctoFarm was built to fill a need that anyone with multiple 3D printers with Octoprint will have run into. How do I manage multiple printers from one place? That's where OctoFarm steps in, add your OctoPrint instances to the system and it will scan and keep you up to date on the status of your printers.
![Dashboard View](https://github.com/NotExpectedYet/OctoFarm/blob/master/screenshots/dashboard.png)

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.

### Platform

Confirmed working on: Linux (Ubuntu, Debian), RaspberryPi (Rasbian), Windows 10.
Should also work on but not tested: MacOS, anything else nodejs will run on.

*Note*: Raspberry Pi's Raspbian OS doesn't officially support running MongoDB yet (MongoDB requires a 64bit kernel, whereas Raspbian's is 32bit), so in that case, you'll need an external database running on some other machine or VM.

### Prerequisites

- [MongoDB](https://www.mongodb.com/) - v4.2+
- [NodeJS](https://nodejs.org/) - v13+
- [NPM](https://www.npmjs.com/) - v6+

### Installation Docker

### TinkerDad's Version

Instructions can be found: [TheTinkerDad/OctoFarm](https://hub.docker.com/r/thetinkerdad/octofarm)

- Massive thanks to TheTinkerDad for making this, he's also better at keeping up with his documentation. Be sure to send him some love on his [Youtube Channel](https://www.youtube.com/channel/UCNaLzBZhXTCwjsDPU03y-kQ)

### OctoFarm Official

BIG thanks to knoker for the help with this!

```sh
docker run -d --name octofarm -e "MONGO=mongodb://172.17.0.2/octofarm" -p4000:4000 octofarm/octofarm
```

Environment Variables

- MONGO = contains mongodb connection string

Ports

- 4000

### Docker compose minimal example

```yml
version: "2"
services:
  octofarm:
    container_name: octofarm
    image: octofarm/octofarm
    restart: always
    ports:
      - 4000:4000
    environment:
      - MONGO=mongodb://octofarm_mongo/octofarm

  octofarm_mongo:
    container_name: octofarm_mongo
    image: bitnami/mongodb
    restart: always
    volumes:
      - <your persistent folder>:/bitnami
    environment:
      - ALLOW_EMPTY_PASSWORD=yes
      - MONGODB_EXTRA_FLAGS='--wiredTigerCacheSizeGB=2'
```

### Installation Production

1. Clone the OctoFarm

```sh
git clone https://github.com/NotExpectedYet/OctoFarm.git
```

2. Install NPM packages

```sh
npm install
```

3. Edit the /config/db.js file with your database.

```sh
module.exports = {
  MongoURI: "mongodb://192.168.1.5:27017/octofarm"
};
//Example Local URL: "mongodb://192.168.1.5:27017/octofarm"
//Example Remote URL: "mongodb+srv://s1mpleman:<YOUR PASSWORD>@cluster0-lgugu.mongodb.net/test?retryWrites=true&w=majority"
```

4. Start the system

```sh
npm start
```

- The production version will run without interaction, but currently there are no way to persist other than something like screen on linux, or using a service you create yourself. The logs will be outputted to \*.log files for error and standard operations. Check the error log if your server unexpectedly halts.

### Installation Development

1. Clone the OctoFarm

```sh
git clone https://github.com/NotExpectedYet/OctoFarm.git
```

2. Install NPM packages

```sh
npm install
```

3. Edit the /config/db.js file with your database.

```sh
module.exports = {
  MongoURI: "mongodb://192.168.1.5:27017/octofarm"
};
//Example Local URL: "mongodb://192.168.1.5:27017/octofarm"
//Example Remote URL: "mongodb+srv://s1mpleman:<YOUR PASSWORD>@cluster0-lgugu.mongodb.net/test?retryWrites=true&w=majority"
```

4. Start the system

```sh
npm run dev
```

- The developer version uses nodemon for live server reloading on changes. It will output all the logs to the console.

## Packaged Versions

These will be coming shortly after the release of version 1.1.

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/NotExpectedYet/OctoFarm/issues) for a list of known issues.

<!-- CONTRIBUTING -->

## Contributing

I am currently not accepting any contribution to the code. I started this project to teach myself nodejs and Javascript better. With my current plans I will have exhausted most learning opportunities by Version 1.2 and will be happy to take pull requests from people then. Thanks for understanding.

<!-- LICENSE -->

## License

Distributed under GNU Affero General Public License v3.0. See `LICENSE` for more information.

<!-- CONTACT -->

## Contact

- Email: [Email NotExpectedYet](mailto:info@notexpectedyet.com)

- Project Link: [https://github.com/NotExpectedYet/OctoFarm](https://github.com/NotExpectedYet/OctoFarm)

- Discord: [Discord](https://discord.gg/CkNDRgK)

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

- [Gina Häußge](https://octoprint.org/) - Without OctoPrint none of this would be possible. Massive thanks to the work of Gina and everyone who helps out with that.
- [Derek from 3D Printed Debris](https://www.3dprinteddebris.com/) - Massive big thanks to Derek who has donated a lot of time and money to the project. I don't think I'd have continued at the rate I did without his bug reports and support.
- All Patreon Supporters and random donations! - Big massive thanks for these, they keep me full of steak!

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=flat-square
[contributors-url]: https://github.com/NotExpectedYet/OctoFarm/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=flat-square
[forks-url]: https://github.com/NotExpectedYet/OctoFarm/network/members
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=flat-square
[stars-url]: https://github.com/NotExpectedYet/OctoFarm/stargazers
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=flat-square
[issues-url]: https://github.com/NotExpectedYet/OctoFarm/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=flat-square
[license-url]: https://github.com/NotExpectedYet/OctoFarm/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://www.linkedin.com/in/james-mackay-b1bbb3124/
[product-screenshot]: images/screenshot.png
