# :octopus: :octopus: OctoFarm's Changelog :octopus: :octopus:

### [1.2.10](https://github.com/OctoFarm/OctoFarm/compare/1.2.9...1.2.10) (2022-06-19)


### :hammer: Bug Fixes :hammer:

* **client:** correct typos on printer manager hover hints fixed [#1101](https://github.com/OctoFarm/OctoFarm/issues/1101) ([0d3a3f3](https://github.com/OctoFarm/OctoFarm/commit/0d3a3f3159caba2c26a5bafcb618ae031f5c293a))
* **client:** file manager would fail to load subsequent printers without current profile key ([3951e66](https://github.com/OctoFarm/OctoFarm/commit/3951e66cd219f1019d9ea025ee18c743ec117572))
* **client:** fix power action on printer manager so it opens modal fixed [#1097](https://github.com/OctoFarm/OctoFarm/issues/1097) ([480bb94](https://github.com/OctoFarm/OctoFarm/commit/480bb94c7a1c9bb60a353330a0fc73ffd933a7f0))
* **client:** fix update octofarm button so it runs restart command after update fixed [#1094](https://github.com/OctoFarm/OctoFarm/issues/1094) ([3e3aced](https://github.com/OctoFarm/OctoFarm/commit/3e3acedfd42d38c1fb37579fd52e12ad9b9f49f8))
* **client:** usage bar would reset to 0 on page load ([8d2a086](https://github.com/OctoFarm/OctoFarm/commit/8d2a0860f231d40896ff7daf2461546475e41d2b))


### :persevere: Code Refactors :persevere:

* **client:** if no octofarm user is availble from history record display op user ([5eb0234](https://github.com/OctoFarm/OctoFarm/commit/5eb02340f80ae9a5ec1b32ba76e6d8e777b3bb4e))
* **main:** add note to changelog about new location of changelog ([04c19f7](https://github.com/OctoFarm/OctoFarm/commit/04c19f7dd66c2255e41489d1e2c87d61703d566a))
* **server:** always install dependencies with automated updater ([6ac7593](https://github.com/OctoFarm/OctoFarm/commit/6ac759366b902d63522d5f365e98ddd59d47d136))
* **server:** replace fetch client command to check installed package not package.json ([752d0eb](https://github.com/OctoFarm/OctoFarm/commit/752d0ebd4d0519998ac53edd0a906172090bb6a6))
* **server:** send history data to client ([32dba46](https://github.com/OctoFarm/OctoFarm/commit/32dba4668e4aba524aaa2fe8056c289874747986))
* **server:** wait for stable websocket before checking if connection is in the toilet ([64928f2](https://github.com/OctoFarm/OctoFarm/commit/64928f26c0cd95976ab51db36baef0498f52d3ca))

### [1.2.9](https://github.com/OctoFarm/OctoFarm/compare/1.2.8...1.2.9) (2022-06-17)


### :persevere: Code Refactors :persevere:

* **client:** add, are you sure, confirm button to nuke all database options ([b5dd1f8](https://github.com/OctoFarm/OctoFarm/commit/b5dd1f8a3b964b5725be94b6dcee4eb5db5ba709))
* **client:** make cors warning icon red not blue ([13d1269](https://github.com/OctoFarm/OctoFarm/commit/13d12694114b18a043cc609874df0c012881bc2c))
* **client:** remove incorrect 'routes' string from export and nuke history ([49952be](https://github.com/OctoFarm/OctoFarm/commit/49952be6e46c70b4528ab3a5b74a1f3e97eb6b8d))
* **server:** convert octoprint user name to lower case and check if 'octofarm' is included ([3eb2b6c](https://github.com/OctoFarm/OctoFarm/commit/3eb2b6cc5fa84f692da36f4708ce3d4483320261))
* **server:** force update throttle rate on disconnected printers ([74b4ccb](https://github.com/OctoFarm/OctoFarm/commit/74b4ccb9e253d2b20123b2de0272feef2e07a999))
* **server:** make sure last websocket message time always date object ([e92e733](https://github.com/OctoFarm/OctoFarm/commit/e92e733a97c9513345532406d802db0d791875c8))
* **server:** rework user flow to support octofarm based strings ([0ef71d2](https://github.com/OctoFarm/OctoFarm/commit/0ef71d283cbf72b9091af7c62fef2ff8150e2578))


### :hammer: Bug Fixes :hammer:

* **client:** add in delay for importing printers fixed [#1064](https://github.com/OctoFarm/OctoFarm/issues/1064) ([4465526](https://github.com/OctoFarm/OctoFarm/commit/4465526697b15d5a6d761399052ee668501a38a1))
* **client:** check printer power state before actioning print/connect sequence fixed [#1090](https://github.com/OctoFarm/OctoFarm/issues/1090) ([5ebaf64](https://github.com/OctoFarm/OctoFarm/commit/5ebaf641a37c5c8567cbe44db9ddbbba767ca124))
* **client:** correctly calculate remaining filament total fixed [#1091](https://github.com/OctoFarm/OctoFarm/issues/1091) ([d2b491f](https://github.com/OctoFarm/OctoFarm/commit/d2b491ff3d80adc94ab18f0d057ec9e0640b5f8e))
* **client:** couldn't connect printers or start prints from file manager power plugin fixed [#1084](https://github.com/OctoFarm/OctoFarm/issues/1084) ([f1d6d3e](https://github.com/OctoFarm/OctoFarm/commit/f1d6d3e3442925fb347b575d6f0afc29b0f7ea83))
* **client:** tool 0 would always head with bulk pre-heat command [#1083](https://github.com/OctoFarm/OctoFarm/issues/1083) ([2da5961](https://github.com/OctoFarm/OctoFarm/commit/2da59615da77cc8913d2a933c03b536591ea2d6d))
* **server:** additional server settings checks before deattaching spools fixed [#1091](https://github.com/OctoFarm/OctoFarm/issues/1091) ([44bad38](https://github.com/OctoFarm/OctoFarm/commit/44bad386c25f4fadd24070260cde9ebc3893dbe0))
* **server:** create migrate script to regenerate broken history dates set to epoch ([30525bb](https://github.com/OctoFarm/OctoFarm/commit/30525bbb38c80b1249e2a3b6e83b5cf936d3bb3a))
* **server:** failing cors check considers printer offline and forces user to fix fixed [#1093](https://github.com/OctoFarm/OctoFarm/issues/1093) ([d0040c4](https://github.com/OctoFarm/OctoFarm/commit/d0040c445e65c09a808b3698de0337a0b19702f6))
* **server:** incorrectly still checking for api timeout health check [#1086](https://github.com/OctoFarm/OctoFarm/issues/1086) ([6abca44](https://github.com/OctoFarm/OctoFarm/commit/6abca440a8c97f55c301acc61a9f645835d7dd3e))
* **server:** octofarm not correctly parsing list of users fixed [#1081](https://github.com/OctoFarm/OctoFarm/issues/1081) ([5989ba0](https://github.com/OctoFarm/OctoFarm/commit/5989ba0ffa8059a4e6477288d2e7956d11c74103))
* **server:** use average of last websocket messages rather than last for throttle [#1087](https://github.com/OctoFarm/OctoFarm/issues/1087) ([c89407f](https://github.com/OctoFarm/OctoFarm/commit/c89407fc884ea86e1ab2eda853fdb439c7ea2a73))

### 1.2.8 (2022-06-14)


### :persevere: Code Refactors :persevere:

* **server:** add warning log when downdating spools used value ([c4e0af2](https://github.com/OctoFarm/OctoFarm/commit/c4e0af29e068f1116064dfdfcd84b5d76a7782fe))