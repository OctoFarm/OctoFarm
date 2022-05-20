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
[![semantic-release: nodejs](https://img.shields.io/badge/semantic--release-angular-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)

# OctoFarm [![Latest Release](https://img.shields.io/github/release/octofarm/octofarm)](https://img.shields.io/github/v/tag/octofarm/octofarm?sort=date)

<div align="center">
  <a href="https://github.com/NotExpectedYet/OctoFarm">
    <img src="https://github.com/OctoFarm/OctoFarm/blob/master/server/views/images/logo.png?raw=true" alt="Logo" width="400px">
  </a>

  <p align="center">
    OctoFarm is a single pane of glass that combines multiple OctoPrint instances into a single interface. It utilises the OctoPrint API and websocket systems to monitor and allow management of your 3d printer farm. <br/>
  </p>

  <p align="center">
    A free and open source makers farm management software
    <br />
    <a href="https://docs.octofarm.net"><strong>Explore the documentation</strong></a>
    <br />
    <br />
    ·
    <a href="https://github.com/octofarm/octofarm/issues">Report a bug</a>
    ·
    <a href="https://github.com/OctoFarm/OctoFarm/discussions/new">Request a feature or ask a question</a>
  </p>
</div>

- [About OctoFarm](#about-octofarm)
- [Need help?](#need-help)
- [Getting Started](#getting-started)
- [Installation Production](#installation-production)
- [Installation Development](#installation-development)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## About OctoFarm

![OctoFarm Dashboard][DashboardScreenshot]

OctoFarm was built to fill a need that anyone with multiple 3D printers with Octoprint will have run into. How do I
manage multiple printers from one place? That's where OctoFarm steps in, add your OctoPrint instances to the system and
it will scan and keep you up to date on the status of your printers.

Built by a maker, for makers to get more out of their OctoPrint run farms.

- Manager your OctoPrint instances right down to triggering Updates and Plugin installs.
- Keep a track of all the live data on your farm with a selection of views.
- Manage your OctoPrint file system.
- Get an overview of your farm with the customisable dashboard.
- Manage and track filament on your farm.
- Track history and logs for all of your instances.
- Supports a wide variety of OctoPrint plugins to augment the OctoFarm system with more information.

## Need help?

Feel free to join any of the OctoFarm communities or follow OctoFarms progress on it's blog.

- [OctoFarms Website](https://octofarm.net/)
- [OctoFarms Documentation](https://docs.octofarm.net/)
- [OctoFarm Blog](https://octofarm.net/blog/)
- [Community Support on Facebook](https://www.facebook.com/groups/octofarm/)
- [Community Support on Discord](https://discord.gg/vjabMUn/)
- [General Question or Feature Request?](https://github.com/OctoFarm/OctoFarm/discussionss/)
- [Fancy donating to the project?](https://octofarm.net/sponsorship/)

## Getting Started

Before installing it is best to read the getting started documents here:
[Getting Started](https://docs.octofarm.net/getting-started/)

## Installation Production
Check out the OctoFarm documentation website for installation instructions on various platforms
[Getting Started](https://docs.octofarm.net/installation/)

## Installation Development
1. Clone the OctoFarm

```sh
git clone https://github.com/NotExpectedYet/OctoFarm.git
```

2. Install the mono-repo eslint dependencies (eslint, prettier and nodemon)

```sh
npm install
```

3. Install server and client dependencies

```sh
npm run setup-dev
```

4. Create an `.env` file in the OctoFarm folder's root directory. e.g. `OctoFarm/.env`.
   Paste in the contents below.
```dotenv
NODE_ENV=development
MONGO=mongodb://127.0.0.1:27017/octofarm
OCTOFARM_PORT=4000
```

5. Build the latest client
```sh
npm run build-client
```

6. (Optional): Watch for client changes, requires a secondary console.
```sh
npm run dev-client
```

7. Start the server

```sh
npm run server-dev
```
- The developer version uses nodemon for live server reloading on changes. It will output all the logs to the console.


## License

This work [is licensed](https://github.com/OctoFarm/OctoFarm/blob/master/LICENSE.txt) under the [GNU Affero General Public License v3](https://www.gnu.org/licenses/agpl-3.0.html).

## Contact

You can contact me at [info@notexpectedyet.com](mailto:info@notexpectedyet.com)

## Acknowledgements

- [My Patreons](https://www.patreon.com/NotExpectedYet) - You all keep me going and afford me a financial incentive to keep OctoFarm up to date with new features and fixes! Biggest thanks of all.
- [Gina Häußge](https://octoprint.org/) - Without OctoPrint none of this would be possible. Massive thanks to the work
  of Gina and everyone who helps out with that.
- All Patreon Supporters and random donations! - Big massive thanks for these, they keep me full of steak!
- [Derek from 3D Printed Debris](https://www.3dprinteddebris.com/) - Massive big thanks to Derek who has donated a lot
  of time and money to the project. I don't think I'd have continued at the rate I did without his bug reports and
  support.
- [JetBrains IDE](https://www.jetbrains.com/webstorm/) - Thanks to JebBrains for allowing a free license to use with
  developing my application. Their IDE is top notch!

[DashboardScreenshot]: https://github.com/NotExpectedYet/OctoFarm/blob/master/screenshots/dashboard.png?raw=true