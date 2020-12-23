<!-- PROJECT LOGO -->

[![GitHub issues](https://img.shields.io/github/issues/NotExpectedYet/OctoFarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/issues)
[![GitHub forks](https://img.shields.io/github/forks/NotExpectedYet/OctoFarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/network)
[![GitHub stars](https://img.shields.io/github/stars/NotExpectedYet/OctoFarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/stargazers)
[![GitHub license](https://img.shields.io/github/license/NotExpectedYet/OctoFarm?style=for-the-badge)](https://github.com/NotExpectedYet/OctoFarm/blob/master/LICENSE.txt)

<h3 align="center">Current Feature Requests</h3>

  <p>Please visit <a href="https://features.octofarm.net">Octofarm's Features Page to log a request.</a>

  <h3 align="center">Version 1.1.6</h3>
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

<!-- ABOUT THE PROJECT -->

## About The Project

OctoFarm was built to fill a need that anyone with multiple 3D printers with Octoprint will have run into. How do I manage multiple printers from one place? That's where OctoFarm steps in, add your OctoPrint instances to the system and it will scan and keep you up to date on the status of your printers.
![Dashboard View](https://github.com/NotExpectedYet/OctoFarm/blob/master/screenshots/dashboard.png)

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps.


## OctoPrint 1.4.1+ 

Currently there are issues with using the Global API Key to connect to these instances of OctoPrint. Please use the first user you setup on OctoPrint and a generated Application / User API key from this user to connect. I will be updating OctoFarm to work better with all permission sets eventually but for now this will allow a connection to be established. 


### Platform

Confirmed working on: Linux (Ubuntu, Debian), RaspberryPi (Rasbian), Windows 10.
Should also work on but not tested: MacOS, anything else nodejs will run on.

_Note_: Raspberry Pi's Raspbian OS doesn't officially support running MongoDB yet (MongoDB requires a 64bit kernel, whereas Raspbian's is 32bit), so in that case, you'll need an external database running on some other machine or VM.

### Supported Browsers

All browsers should now be supported in OctoFarm. Please log an issue if this is not the case. 


### Prerequisites

- [MongoDB](https://www.mongodb.com/) - v3.6+
- [NodeJS](https://nodejs.org/) - v12.18.4 (Recomended to use the LTS version)
- [NPM](https://www.npmjs.com/) - v6+
- [OctoPrint](https://octoprint.org) - v1.3.9+

On your OctoPrint instance

- User Name -> User Settings
- Copy the API Key some place easy to get to
- Enabled the "Allow Cross Origin Resource Sharing (CORS)
- Restart OctoPrint
- Repeat for all OctoPrints that will be added to the Farm

#See The WIKI for more detailed instructions than what's available below

### Installation
All user documentation is now moving to OctoFarm.net. Development documentation below. 

https://octofarm.net


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

4. Install nodemon

```sh
npm install --save-dev nodemon
```

5. Start the system

```sh
npm run dev
```

- The developer version uses nodemon for live server reloading on changes. It will output all the logs to the console.
- The developer version will skip some basic sanity checks, if your pages don't load right after server boot then it's because those sanity checks haven't finished.

## Packaged Versions

These are planned but not available yet...

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

- Discord: [Discord](https://discord.gg/vjabMUn)

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

- [Gina Häußge](https://octoprint.org/) - Without OctoPrint none of this would be possible. Massive thanks to the work of Gina and everyone who helps out with that.
- [Derek from 3D Printed Debris](https://www.3dprinteddebris.com/) - Massive big thanks to Derek who has donated a lot of time and money to the project. I don't think I'd have continued at the rate I did without his bug reports and support.
- All Patreon Supporters and random donations! - Big massive thanks for these, they keep me full of steak!
- The users calonmer, Insertion and noxin from my discord server! Seriously no end to my thanks for these 3.
- [JetBrains IDE](https://www.jetbrains.com/webstorm/) - Thanks to JebBrains for allowing a free license to use with developing my application. Their IDE is top notch! 

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
