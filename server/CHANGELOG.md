# :octopus: :octopus: OctoFarm's Server Changelog :octopus: :octopus:

### [1.4.1](https://github.com/OctoFarm/OctoFarm/compare/client-1.4.0...1.4.1) (2022-06-23)

# :octopus: :octopus: OctoFarm's Changelog :octopus: :octopus:

### :persevere: Code Refactors :persevere:
* **server:** added in logging for camera and octoprint proxy (https://github.com/OctoFarm/OctoFarm/pull/1118/commits/63a715b4f480a68eb5856c95ead0f43998cc0a0c)
* **server:** move client side power checking to server(https://github.com/OctoFarm/OctoFarm/pull/1118/commits/1f0020ded2a47dcc22278296883f2deb52ccb70c) https://github.com/OctoFarm/OctoFarm/issues/1117

### :hammer: Bug Fixes :hammer:
* **server:** server wan't sending storage information to client ([aba0109](https://github.com/OctoFarm/OctoFarm/pull/1118/commits/aba010998851123aad62c0e738b1f5ff6d83e4c6))

## [1.4.0](https://github.com/OctoFarm/OctoFarm/compare/1.3.0...1.4.0) (2022-06-22)


### :persevere: Code Refactors :persevere:

* **server:** create /camera/ endpoint to proxy cameras through ([8f0e89a](https://github.com/OctoFarm/OctoFarm/commit/8f0e89a11ef8cd3a27873f2fd7b3342d9a5eedb7))
* **server:** create /octoprint/ endpoint to proxy all octoprint requests through ([c4e17f7](https://github.com/OctoFarm/OctoFarm/commit/c4e17f7bbb7ccfc7d9f8eda04b85b86470520b46))
* **server:** create convert service from camURL => clientCamURL for camera proxy ([31b162a](https://github.com/OctoFarm/OctoFarm/commit/31b162a18d0dc716de96b47c2d7538143a7653af))
* **server:** remove CORS check and warning no longer needed ([5875e81](https://github.com/OctoFarm/OctoFarm/commit/5875e8125a152d16703175f53852be3d8bf3344e))


### :stars: New Features :stars:

* **client:** redirect all octoprint commands through the octofarm proxy ([9a16b5c](https://github.com/OctoFarm/OctoFarm/commit/9a16b5cff05b440ab67295e01236568f52b9ae35))
* **server:** proxy cameras through octofarm server ([cec5c85](https://github.com/OctoFarm/OctoFarm/commit/cec5c85a78a7ba35c4f7c84d10488b2dcd7fce06))
* **server:** redirect all file uploads through the octofarm proxy ([b5dfeb2](https://github.com/OctoFarm/OctoFarm/commit/b5dfeb2d106f4dc8f8b1f91f51a4e36c106bea4c))


### :hammer: Bug Fixes :hammer:

* **client:** fix filtering on filament spool manager table closes [#1106](https://github.com/OctoFarm/OctoFarm/issues/1106) ([1d07e4a](https://github.com/OctoFarm/OctoFarm/commit/1d07e4a7d7ebe25a2cffcd4cfa7392ab77d121df))
* **client:** fix history state graph total count not generating closes [#1104](https://github.com/OctoFarm/OctoFarm/issues/1104) ([41ecfa4](https://github.com/OctoFarm/OctoFarm/commit/41ecfa4a0d6822f7cd1c4e823068ccee823cb52e))
* **client:** fix storage used warning not using storage used for calculation closes [#1108](https://github.com/OctoFarm/OctoFarm/issues/1108) ([95d9835](https://github.com/OctoFarm/OctoFarm/commit/95d98351aed332cbb2ab64345183b50d9bb041d0))
* **client:** history printer cost total not calculating correctly ([e9241f5](https://github.com/OctoFarm/OctoFarm/commit/e9241f58898902e23eae88a904c0f51f6c7bcaa6))
* **client:** ignore used spools in filament spool manager total table count ([1efa012](https://github.com/OctoFarm/OctoFarm/commit/1efa012e8492dcef6f8d7a5dc2ea969fb570e9b6))
* **server:** allow inputting blank group name in printer edit closes [#1096](https://github.com/OctoFarm/OctoFarm/issues/1096) ([439cf67](https://github.com/OctoFarm/OctoFarm/commit/439cf67d7aaa6aef466b031bff768e3b54a645b6))
* **server:** fix initial grab of supported plugin data and octoprint name ([ff67914](https://github.com/OctoFarm/OctoFarm/commit/ff6791491d00353cbef604c799f10f25290c6efb))
* **server:** grab installed client version from package-lock fixed [#1107](https://github.com/OctoFarm/OctoFarm/issues/1107) ([873dd9c](https://github.com/OctoFarm/OctoFarm/commit/873dd9c2f4aab26e8e4262aff9e075bd0e304f55))

## [1.3.0](https://github.com/OctoFarm/OctoFarm/compare/1.2.11...1.3.0) (2022-06-20)


### :persevere: Code Refactors :persevere:

* **client:** allow filament, history, file manager and printers to display current op ([7aae27a](https://github.com/OctoFarm/OctoFarm/commit/7aae27aeebc9296304b55209cebf78b9885cad87))
* **client:** update client current operations when event triggered from server ([393a649](https://github.com/OctoFarm/OctoFarm/commit/393a6499de6eff21e7801dd8ee8b3201a41214a6))
* **server:** create self contained current operations service ([cece76b](https://github.com/OctoFarm/OctoFarm/commit/cece76b16f51e80d4a0ee0717c7594ccb71f0bba))
* **server:** update mongodb schema to support current operations on various pages ([1019d76](https://github.com/OctoFarm/OctoFarm/commit/1019d768b28d743fc7871f820d71de31dc9a393c))
* **server:** utilise events service when current operations is generated ([c52255b](https://github.com/OctoFarm/OctoFarm/commit/c52255bf4addf8cef800a838b2b7f0b8132365d2))


### :stars: New Features :stars:

* **client:** allow user to add current operations to printers, history, file and filament manager ([b5bddea](https://github.com/OctoFarm/OctoFarm/commit/b5bddea47ab6cc2cf7256db99f828ec1eff87724))

### [1.2.11](https://github.com/OctoFarm/OctoFarm/compare/1.2.10...1.2.11) (2022-06-19)


### :persevere: Code Refactors :persevere:

* **client:** display users ip address in active sessions ([8e7e178](https://github.com/OctoFarm/OctoFarm/commit/8e7e178bd1eda84ea537975269183b2027f37815))
* **server:** capture client endpoint and ip ([f9f8c5b](https://github.com/OctoFarm/OctoFarm/commit/f9f8c5bdbdf26ec81216476da3b1d95116134f21))


### :hammer: Bug Fixes :hammer:

* **client:** add in missing percent unit for current operations progress bar ([74cdee8](https://github.com/OctoFarm/OctoFarm/commit/74cdee8b70ced25ed5c9c33f325fd949e698f402))

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
