[comment]: <> ([![Latest Release]&#40;https://img.shields.io/github/release/octofarm/octofarm?style=appveyor&#41;]&#40;https://img.shields.io/github/v/tag/octofarm/octofarm?sort=date&#41;)
![Docker Pulls](https://img.shields.io/docker/pulls/octofarm/octofarm?style=appveyor)
![GitHub release (latest by date)](https://img.shields.io/github/downloads/octofarm/octofarm/latest/total?style=appveyor)
[![GitHub stars](https://img.shields.io/github/stars/octofarm/octofarm?style=appveyor)](https://github.com/NotExpectedYet/OctoFarm/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/octofarm/octofarm?style=appveyor)](https://github.com/NotExpectedYet/OctoFarm/network)
[![GitHub license](https://img.shields.io/github/license/octofarm/octofarm?style=appveyor)](https://github.com/NotExpectedYet/octofarm/blob/master/LICENSE.txt)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/octofarm/octofarm/ci?style=appveyor)
![GitHub issues](https://img.shields.io/github/issues/octofarm/octofarm?color=green&style=appveyor)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=appveyor)](https://GitHub.com/octofarm/octofarm/graphs/commit-activity)
[![Download Dockerhub](https://img.shields.io/badge/DOCKERHUB-OCTOFARM-<COLOR>.svg?style=appveyor)](https://hub.docker.com/r/octofarm/octofarm)

# OctoFarm [![Latest Release](https://img.shields.io/github/release/octofarm/octofarm)](https://img.shields.io/github/v/tag/octofarm/octofarm?sort=date)
<div align="center">
  <a href="https://github.com/NotExpectedYet/OctoFarm">
    <img src="https://github.com/OctoFarm/OctoFarm/blob/master/views/images/logo.png?raw=true" alt="Logo" width="400px">
  </a>

  <p align="center">
    OctoFarm is an easy to setup and install web server and client for creating a single pane of glass for all of your OctoPrint instances. <br/>You can manage and monitor as many instances as you want from a single interface giving you full control over your 3D printer farm.
    <br />
    <a href="https://docs.octofarm.net"><strong>Explore the docs »</strong></a>
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
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## About The Project
OctoFarm was built to fill a need that anyone with multiple 3D printers with Octoprint will have run into. How do I
manage multiple printers from one place? That's where OctoFarm steps in, add your OctoPrint instances to the system and
it will scan and keep you up to date on the status of your printers.

![OctoFarm Dashboard][DashboardScreenshot]

## Getting Started
Before installing it is best to read the getting started documents here:
[Getting Started](https://docs.octofarm.net/getting-started/)

### Production Installation.
Please choose the direct NodeJS installation or the Docker image.
1) Installing OctoFarm - read the following: [OctoFarm.net installation instructions](https://octofarm.net/installation) 
2) Docker image(s) [docker or docker-compose usage instructions](https://docs.octofarm.net/installation/install-docker)
3) Installation for Development (Node 14+, Nodemon)

### Development Installation
1. Clone the OctoFarm

```sh
git clone https://github.com/NotExpectedYet/OctoFarm.git
```

2. Install package dependencies

```sh
npm run setup-dev
```

3. Create an `.env` file in the OctoFarm folder's root directory. e.g. `OctoFarm/.env`.
Paste in the contents below.
```dotenv
NODE_ENV=development
MONGO=mongodb://127.0.0.1:27017/octofarm
OCTOFARM_PORT=4000
```

4. Build the latest client
```sh
npm run build-client
```

5. (Optional): Watch for client changes
```sh
npm run dev-client
```

7. Start the server

```sh
npm run server-dev
```
- The developer version uses nodemon for live server reloading on changes. It will output all the logs to the console.

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
- [Derek from 3D Printed Debris](https://www.3dprinteddebris.com/) - Massive big thanks to Derek who has donated a lot
  of time and money to the project. I don't think I'd have continued at the rate I did without his bug reports and
  support.
- [JetBrains IDE](https://www.jetbrains.com/webstorm/) - Thanks to JebBrains for allowing a free license to use with
  developing my application. Their IDE is top notch!

[DashboardScreenshot]: https://github.com/NotExpectedYet/OctoFarm/blob/master/screenshots/dashboard.png?raw=true
