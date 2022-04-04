[![Packagist][packagist-shield]][packagist-url]
[![License][license-shield]][license-url]
[![Stargazers][stars-shield]][stars-url]
[![Donate][donate-shield]][donate-url]
[![huntr][hack-shield]][hack-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://firefly-iii.org/">
    <img src="https://raw.githubusercontent.com/firefly-iii/firefly-iii/develop/.github/assets/img/logo-small.png" alt="Firefly III" width="120" height="178">
  </a>
</p>
  <h1 align="center">Firefly III</h1>

  <p align="center">
    A free and open source personal finance manager
    <br />
    <a href="https://docs.firefly-iii.org/"><strong>Explore the documentation</strong></a>
    <br />
    <br />
    <a href="https://demo.firefly-iii.org/">View the demo</a>
    ·
    <a href="https://github.com/firefly-iii/firefly-iii/issues">Report a bug</a>
    ·
    <a href="https://github.com/firefly-iii/firefly-iii/issues">Request a feature</a>
    ·
    <a href="https://github.com/firefly-iii/firefly-iii/discussions">Ask questions</a>
  </p>

<!-- MarkdownTOC autolink="true" -->

- [About Firefly III](#about-firefly-iii)
  - [Purpose](#purpose)
- [Need help?](#need-help)
- [Features](#features)
- [Who's it for?](#whos-it-for)
- [The Firefly III eco-system](#the-firefly-iii-eco-system)
- [Getting Started](#getting-started)
- [Contributing](#contributing)
  - [Support the development of Firefly III](#support-the-development-of-firefly-iii)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

<!-- /MarkdownTOC -->

## About Firefly III

<p align="center">
	<img src="https://raw.githubusercontent.com/firefly-iii/firefly-iii/develop/.github/assets/img/imac-complete.png" alt="Firefly III on iMac" />
</p>

"Firefly III" is a (self-hosted) manager for your personal finances. It can help you keep track of your expenses and income, so you can spend less and save more. Firefly III supports the use of budgets, categories and tags. Using a bunch of external tools, you can import data. It also has many neat financial reports available.

Firefly III should give you **insight** into and **control** over your finances. Money should be useful, not scary. You should be able to *see* where it is going, to *feel* your expenses and to... wow, I'm going overboard with this aren't I?

But you get the idea: this is your money. These are your expenses. Stop them from controlling you. I built this tool because I started to dislike money. Having money, not having money, paying bills with money, you get the idea. But no more. I want to feel "safe", whatever my balance is. And I hope this tool can help you. I know it helps me.

### Purpose

<p align="center">
  <img src="https://raw.githubusercontent.com/firefly-iii/firefly-iii/develop/.github/assets/img/ipad-complete.png" alt="Firefly III on iPad" width="600">
</p>

Personal financial management is pretty difficult, and everybody has their own approach to it. Some people make budgets, other people limit their cashflow by throwing away their credit cards, others try to increase their current cashflow. There are tons of ways to save and earn money. Firefly III works on the principle that if you know where your money is going, you can stop it from going there.

By keeping track of your expenses and your income you can budget accordingly and save money. Stop living from paycheck to paycheck but give yourself the financial wiggle room you need.

You can read more about the purpose of Firefly III in the [documentation](https://docs.firefly-iii.org/).

<!-- HELP TEXT -->
## Need help?

If you need support using Firefly III or the associated tools, come find us!

- [GitHub Discussions for questions and support](https://github.com/firefly-iii/firefly-iii/discussions/)
- [Gitter.im for a good chat and a quick answer](https://gitter.im/firefly-iii/firefly-iii)
- [GitHub Issues for bugs and issues](https://github.com/firefly-iii/firefly-iii/issues)
- [Follow me around for news and updates on Twitter](https://twitter.com/Firefly_iii)

<!-- END OF HELP TEXT -->

## Features

Firefly III is pretty feature packed. Some important stuff first:

* It is completely self-hosted and isolated, and will never contact external servers until you explicitly tell it to.
* It features a REST JSON API that covers almost every part of Firefly III.

The most exciting features are:

* Create [recurring transactions to manage your money](https://docs.firefly-iii.org/advanced-concepts/recurring).
* [Rule based transaction handling](https://docs.firefly-iii.org/advanced-concepts/rules) with the ability to create your own rules.

Then the things that make you go "yeah OK, makes sense".

* A [double-entry](https://en.wikipedia.org/wiki/Double-entry_bookkeeping_system) bookkeeping system.
* Save towards a goal using [piggy banks](https://docs.firefly-iii.org/advanced-concepts/piggies).
* View [income and expense reports](https://docs.firefly-iii.org/advanced-concepts/reports).

And the things you would hope for but not expect:

* 2 factor authentication for extra security 🔒.
* Supports [any currency you want](https://docs.firefly-iii.org/concepts/currencies), including crypto currencies such as ₿itcoin and Ξthereum.
* There is a [Docker image](https://docs.firefly-iii.org/installation/docker) and an [Heroku script](https://docs.firefly-iii.org/installation/third_parties).

And to organise everything:

* Clear views that should show you how you're doing.
* Easy navigation through your records.
* Lots of charts because we all love them.

Many more features are listed in the [documentation](https://docs.firefly-iii.org/about-firefly-iii/introduction).

## Who's it for?
<img src="https://raw.githubusercontent.com/firefly-iii/firefly-iii/develop/.github/assets/img/iphone-complete.png" alt="Firefly III on iPhone" align="left" width="250">

This application is for people who want to track their finances, keep an eye on their money **without having to upload their financial records to the cloud**. You're a bit tech-savvy, you like open source software and you don't mind tinkering with (self-hosted) servers.

 <br clear="left"/>

## The Firefly III eco-system

Several users have built pretty awesome stuff around the Firefly III API. [Check out these tools in the documentation](https://docs.firefly-iii.org/other-pages/3rdparty).

## Getting Started

There are many ways to run Firefly III
1. There is a [demo site](https://demo.firefly-iii.org) with an example financial administration already present.
2. You can [install it on your server](https://docs.firefly-iii.org/installation/self_hosted).
3. You can [run it using Docker](https://docs.firefly-iii.org/installation/docker).
4. You can [install it using Softaculous](https://www.softaculous.com/softaculous/apps/others/Firefly_III).
5. You can [install it using AMPPS](https://www.ampps.com/).
6. You can [install it on Cloudron](https://cloudron.io/store/org.fireflyiii.cloudronapp.html).
7. You can [install it on Lando](https://gist.github.com/ArtisKrumins/ccb24f31d6d4872b57e7c9343a9d1bf0).
8. You can [install it on Yunohost](https://github.com/YunoHost-Apps/firefly-iii)

## Contributing

You can contact me at [james@firefly-iii.org](mailto:james@firefly-iii.org), you may open an issue in the [main repository](https://github.com/firefly-iii/firefly-iii) or contact me through [gitter](https://gitter.im/firefly-iii/firefly-iii) and [Twitter](https://twitter.com/Firefly_III).

Of course, there are some [contributing guidelines](https://docs.firefly-iii.org/firefly-iii/other-pages/contributing) and a [code of conduct](https://github.com/firefly-iii/firefly-iii/blob/main/.github/code_of_conduct.md), which I invite you to check out.

I can always use your help [squashing bugs](https://docs.firefly-iii.org/support/contribute#bugs), thinking about [new features](https://docs.firefly-iii.org/support/contribute#feature-requests) or [translating Firefly III](https://docs.firefly-iii.org/support/contribute#translations) into other languages.

[Sonarcloud][sc-project-url] scans the code of Firefly III. If you want to help improve Firefly III, check out the latest reports and take your pick!

[![Quality Gate Status][sc-gate-shield]][sc-project-url] [![Bugs][sc-bugs-shield]][sc-project-url] [![Code Smells][sc-smells-shield]][sc-project-url] [![Vulnerabilities][sc-vuln-shield]][sc-project-url]

There is also a [security policy](https://github.com/firefly-iii/firefly-iii/security/policy).

### Support the development of Firefly III

If you like Firefly III and if it helps you save lots of money, why not send me a dime for every dollar saved! :tada:

OK that was a joke. If you feel Firefly III made your life better, consider contributing as a sponsor. Please check out my [Patreon](https://www.patreon.com/jc5) and [GitHub Sponsors](https://github.com/sponsors/JC5) page for more information. Thank you for considering donating to Firefly III!

## License

This work [is licensed](https://github.com/firefly-iii/firefly-iii/blob/main/LICENSE) under the [GNU Affero General Public License v3](https://www.gnu.org/licenses/agpl-3.0.html).

## Contact

You can contact me at [james@firefly-iii.org](mailto:james@firefly-iii.org), you may open an issue or contact me through the support channels:

- [GitHub Discussions for questions and support](https://github.com/firefly-iii/firefly-iii/discussions/)
- [Gitter.im for a good chat and a quick answer](https://gitter.im/firefly-iii/firefly-iii)
- [GitHub Issues for bugs and issues](https://github.com/firefly-iii/firefly-iii/issues)
- [Follow me around for news and updates on Twitter](https://twitter.com/Firefly_iii)

## Acknowledgements

Over time, [many people have contributed to Firefly III](https://github.com/firefly-iii/firefly-iii/graphs/contributors). I'm grateful for their your support and code contributions.

The Firefly III logo is made by the excellent Cherie Woo.

[packagist-shield]: https://img.shields.io/packagist/v/grumpydictator/firefly-iii.svg?style=flat-square
[packagist-url]: https://packagist.org/packages/grumpydictator/firefly-iii
[license-shield]: https://img.shields.io/github/license/firefly-iii/firefly-iii.svg?style=flat-square
[license-url]: https://www.gnu.org/licenses/agpl-3.0.html
[stars-shield]: https://img.shields.io/github/stars/firefly-iii/firefly-iii.svg?style=flat-square
[stars-url]: https://github.com/firefly-iii/firefly-iii/stargazers
[donate-shield]: https://img.shields.io/badge/donate-%24%20%E2%82%AC-brightgreen?style=flat-square
[donate-url]: #support-the-development-of-firefly-iii
[build-shield]: https://api.travis-ci.com/firefly-iii/firefly-iii.svg?branch=master
[build-url]: https://travis-ci.com/github/firefly-iii/firefly-iii
[sc-gate-shield]: https://sonarcloud.io/api/project_badges/measure?project=firefly-iii_firefly-iii&metric=alert_status
[sc-bugs-shield]: https://sonarcloud.io/api/project_badges/measure?project=firefly-iii_firefly-iii&metric=bugs
[sc-smells-shield]: https://sonarcloud.io/api/project_badges/measure?project=firefly-iii_firefly-iii&metric=code_smells
[sc-vuln-shield]: https://sonarcloud.io/api/project_badges/measure?project=firefly-iii_firefly-iii&metric=vulnerabilities
[sc-project-url]: https://sonarcloud.io/dashboard?id=firefly-iii_firefly-iii
[hack-shield]: https://cdn.huntr.dev/huntr_security_badge_mono.svg
[hack-url]: https://huntr.dev/bounties/disclose
