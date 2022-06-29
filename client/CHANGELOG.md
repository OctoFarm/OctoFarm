# :octopus: :octopus: OctoFarm's Client Changelog :octopus: :octopus:

### [1.5.1](https://github.com/OctoFarm/OctoFarm/compare/client-1.5.0...client-1.5.1) (2022-06-29)


### :curly_loop: UI :curly_loop:

* **client:** add restart required text to camera proxy enable ([d1d6dec](https://github.com/OctoFarm/OctoFarm/commit/d1d6dec3d4ed16f4c197fe22c14630d385fd3aae))
* **client:** fix incorrect hover description for quick connect states, closes [#1143](https://github.com/OctoFarm/OctoFarm/issues/1143) ([00191a1](https://github.com/OctoFarm/OctoFarm/commit/00191a15968b3d91633d9806efd0240d2c3b1d83))
* **client:** improve display of task list in system ([0a3fa4c](https://github.com/OctoFarm/OctoFarm/commit/0a3fa4c08611fe2c94540c0585b45119bc557450))


### :hammer: Bug Fixes :hammer:

* **client:** current operations page would not load due to service change ([b5f26be](https://github.com/OctoFarm/OctoFarm/commit/b5f26bef20e4356a5feb9eb8d46834984f65f4ad))
* **client:** updating cameras inside modals when proxy is enabled, closes [#1152](https://github.com/OctoFarm/OctoFarm/issues/1152) ([90915ae](https://github.com/OctoFarm/OctoFarm/commit/90915ae6ffcddc6c5f62ae2c34dc3363740b40b9))


### :dash: Code Improvements :dash:

* **client:** improve cache busting without relying on ?version, closes [#1147](https://github.com/OctoFarm/OctoFarm/issues/1147) ([a1d4844](https://github.com/OctoFarm/OctoFarm/commit/a1d48448e65bcc9deff7f5a2ef646e116295c5c9))
* **client:** improve loading speed of views, closes [#1146](https://github.com/OctoFarm/OctoFarm/issues/1146) ([68a3c4e](https://github.com/OctoFarm/OctoFarm/commit/68a3c4ed552c22780c71675c44bfe0e3e757d2f8))

## [1.5.0](https://github.com/OctoFarm/OctoFarm/compare/client-1.4.1...client-1.5.0) (2022-06-25)


### :dash: Code Improvements :dash:

* **client:** allow views with cameras to update webcam snapshot on demand ([a3fb638](https://github.com/OctoFarm/OctoFarm/commit/a3fb6386675b0e858a1825018481afb519061d28))


### :stars: New Features :stars:

* **client:** client can activate/deactive camera proxy, default is deactivated ([edaa208](https://github.com/OctoFarm/OctoFarm/commit/edaa208b4dc6c68a85ff264c5d2931a62e8ecb50))
* **client:** global display option for camera aspect ratio deafult,1x1,4x3,16x9 ([8cdac70](https://github.com/OctoFarm/OctoFarm/commit/8cdac70b00e6c51e78b870c801261b4316020c98))
* **client:** show current OctoPrint and Active Control users on Printer Manager ([20a40a1](https://github.com/OctoFarm/OctoFarm/commit/20a40a1b80a7eb5129e5921366ba5d0f0e209228))


### :curly_loop: UI :curly_loop:

* **client:** fix incorrect message on bulk shutdown,reboot of octoprint host ([32e07be](https://github.com/OctoFarm/OctoFarm/commit/32e07bee7d72a1c5a099a49564d284132e074ed3))


### :x: Removed :x:

* **client:** cost and filament usage sort option for now closes [#1138](https://github.com/OctoFarm/OctoFarm/issues/1138) ([5bb9eff](https://github.com/OctoFarm/OctoFarm/commit/5bb9eff752139bbf2b43c3417566426a5d73d857))


### :hammer: Bug Fixes :hammer:

* **client:** bulk printer control not using proxy url if set ([0b310e5](https://github.com/OctoFarm/OctoFarm/commit/0b310e5cd9a0679606c3256da8cc1af2a227c41e))
* **client:** error on updating file thumbnail through octoprint proxy ([9367d7f](https://github.com/OctoFarm/OctoFarm/commit/9367d7f40de26111a8e26608ed25fb262a440a28))
* **client:** showing "done" when in fact its 0 seconds ([cd69f19](https://github.com/OctoFarm/OctoFarm/commit/cd69f190736ecf1fdc3fb4e242e3d9c1a7635288))

### [1.4.1](https://github.com/OctoFarm/OctoFarm/compare/client-1.4.0...client-1.4.1) (2022-06-24)


### :hammer: Bug Fixes :hammer:

* **client:** filament manager wouldn't load all spools on subsequent printers closes [#1127](https://github.com/OctoFarm/OctoFarm/issues/1127) ([3d5ae43](https://github.com/OctoFarm/OctoFarm/commit/3d5ae439e321d0ed1be591c5f7c029cc1dfbf429))

## 1.4.0 (2022-06-23)


### :persevere: Code Refactors :persevere:

* **client:** add, are you sure, confirm button to nuke all database options ([b5dd1f8](https://github.com/OctoFarm/OctoFarm/commit/b5dd1f8a3b964b5725be94b6dcee4eb5db5ba709))
* **client:** allow filament, history, file manager and printers to display current op ([7aae27a](https://github.com/OctoFarm/OctoFarm/commit/7aae27aeebc9296304b55209cebf78b9885cad87))
* **client:** display users ip address in active sessions ([8e7e178](https://github.com/OctoFarm/OctoFarm/commit/8e7e178bd1eda84ea537975269183b2027f37815))
* **client:** health check column for network relating to old api timeout setting fixed [#1078](https://github.com/OctoFarm/OctoFarm/issues/1078) ([6a1417b](https://github.com/OctoFarm/OctoFarm/commit/6a1417b9adc15d2a370287e68106679b469464dc))
* **client:** if no octofarm user is availble from history record display op user ([5eb0234](https://github.com/OctoFarm/OctoFarm/commit/5eb02340f80ae9a5ec1b32ba76e6d8e777b3bb4e))
* **client:** make cors warning icon red not blue ([13d1269](https://github.com/OctoFarm/OctoFarm/commit/13d12694114b18a043cc609874df0c012881bc2c))
* **client:** remove incorrect 'routes' string from export and nuke history ([49952be](https://github.com/OctoFarm/OctoFarm/commit/49952be6e46c70b4528ab3a5b74a1f3e97eb6b8d))
* **client:** remove references to api timeout setting ([4332e6d](https://github.com/OctoFarm/OctoFarm/commit/4332e6d27511c255771a884ea31e009e5a90ec62))
* **client:** rename api re-scan ([#1008](https://github.com/OctoFarm/OctoFarm/issues/1008)) ([0dd5a30](https://github.com/OctoFarm/OctoFarm/commit/0dd5a30d6bf7be5d5cab31331355d8760ba52907)), closes [#988](https://github.com/OctoFarm/OctoFarm/issues/988)
* **client:** update client current operations when event triggered from server ([393a649](https://github.com/OctoFarm/OctoFarm/commit/393a6499de6eff21e7801dd8ee8b3201a41214a6))
* **client:** update default timeout to more safe value of 5000ms ([7dbbab5](https://github.com/OctoFarm/OctoFarm/commit/7dbbab5e259641f6b3b3b602a53a70ddb9ec38f6))


### :stars: New Features :stars:

* **client:** allow user to add current operations to printers, history, file and filament manager ([b5bddea](https://github.com/OctoFarm/OctoFarm/commit/b5bddea47ab6cc2cf7256db99f828ec1eff87724))
* **client:** redirect all octoprint commands through the octofarm proxy ([9a16b5c](https://github.com/OctoFarm/OctoFarm/commit/9a16b5cff05b440ab67295e01236568f52b9ae35))


### :hammer: Bug Fixes :hammer:

* **client:** add in delay for importing printers fixed [#1064](https://github.com/OctoFarm/OctoFarm/issues/1064) ([4465526](https://github.com/OctoFarm/OctoFarm/commit/4465526697b15d5a6d761399052ee668501a38a1))
* **client:** add in missing percent unit for current operations progress bar ([74cdee8](https://github.com/OctoFarm/OctoFarm/commit/74cdee8b70ced25ed5c9c33f325fd949e698f402))
* **client:** bulk deleting printers that don't exist on printer list ([794400d](https://github.com/OctoFarm/OctoFarm/commit/794400db725cc2c52403452841b10fbba0a98815))
* **client:** check printer power state before actioning print/connect sequence fixed [#1090](https://github.com/OctoFarm/OctoFarm/issues/1090) ([5ebaf64](https://github.com/OctoFarm/OctoFarm/commit/5ebaf641a37c5c8567cbe44db9ddbbba767ca124))
* **client:** correct typos on printer manager hover hints fixed [#1101](https://github.com/OctoFarm/OctoFarm/issues/1101) ([0d3a3f3](https://github.com/OctoFarm/OctoFarm/commit/0d3a3f3159caba2c26a5bafcb618ae031f5c293a))
* **client:** correctly calculate remaining filament total fixed [#1091](https://github.com/OctoFarm/OctoFarm/issues/1091) ([d2b491f](https://github.com/OctoFarm/OctoFarm/commit/d2b491ff3d80adc94ab18f0d057ec9e0640b5f8e))
* **client:** couldn't connect printers or start prints from file manager power plugin fixed [#1084](https://github.com/OctoFarm/OctoFarm/issues/1084) ([f1d6d3e](https://github.com/OctoFarm/OctoFarm/commit/f1d6d3e3442925fb347b575d6f0afc29b0f7ea83))
* **client:** don't allow drag and drop uploading of files to offline … ([#1015](https://github.com/OctoFarm/OctoFarm/issues/1015)) ([5aa0364](https://github.com/OctoFarm/OctoFarm/commit/5aa0364d496b89442796d5e1ddd4031d9b9ad718)), closes [#1003](https://github.com/OctoFarm/OctoFarm/issues/1003) [#1003](https://github.com/OctoFarm/OctoFarm/issues/1003)
* **client:** drag and dropping issues ([#1014](https://github.com/OctoFarm/OctoFarm/issues/1014)) ([d160e0f](https://github.com/OctoFarm/OctoFarm/commit/d160e0f042b3aaf14a31421775812cf64c8557d3)), closes [#991](https://github.com/OctoFarm/OctoFarm/issues/991)
* **client:** filament manager incorrectly reacting to hideEmpty setting ([81f3b41](https://github.com/OctoFarm/OctoFarm/commit/81f3b4188706b0754609418081822bb84a17a11f))
* **client:** file manager thumbnails not directing through the proxy ([a93cf34](https://github.com/OctoFarm/OctoFarm/commit/a93cf346d73486ebc272894226e2f74e200e3ac4))
* **client:** file manager would fail to load subsequent printers without current profile key ([3951e66](https://github.com/OctoFarm/OctoFarm/commit/3951e66cd219f1019d9ea025ee18c743ec117572))
* **client:** fix client making errant power plugin calls ([e355609](https://github.com/OctoFarm/OctoFarm/commit/e35560929f5ebb2be980a60ce5c9780b440cb483))
* **client:** fix client not correctly replacing full printer url in power commands ([c222a00](https://github.com/OctoFarm/OctoFarm/commit/c222a00d334a80157204c8ccdd8bb4c0e62f74c1))
* **client:** fix client publish ([#1052](https://github.com/OctoFarm/OctoFarm/issues/1052)) ([547ee64](https://github.com/OctoFarm/OctoFarm/commit/547ee64f18b60306fdc052ef47f08bfaa29bf046))
* **client:** fix filament manager plugin syncing to offline printers ([bf58a7e](https://github.com/OctoFarm/OctoFarm/commit/bf58a7ecf8c29c91db5920879ecf7084091ab499))
* **client:** fix filtering on filament spool manager table closes [#1106](https://github.com/OctoFarm/OctoFarm/issues/1106) ([1d07e4a](https://github.com/OctoFarm/OctoFarm/commit/1d07e4a7d7ebe25a2cffcd4cfa7392ab77d121df))
* **client:** fix history state graph total count not generating closes [#1104](https://github.com/OctoFarm/OctoFarm/issues/1104) ([41ecfa4](https://github.com/OctoFarm/OctoFarm/commit/41ecfa4a0d6822f7cd1c4e823068ccee823cb52e))
* **client:** fix iframe and disabled printers ([#972](https://github.com/OctoFarm/OctoFarm/issues/972)) ([f8fe124](https://github.com/OctoFarm/OctoFarm/commit/f8fe12477796768529a75f359da1ef4daf7046f3)), closes [#968](https://github.com/OctoFarm/OctoFarm/issues/968) [#963](https://github.com/OctoFarm/OctoFarm/issues/963) [#969](https://github.com/OctoFarm/OctoFarm/issues/969) [#971](https://github.com/OctoFarm/OctoFarm/issues/971)
* **client:** fix power action on printer manager so it opens modal fixed [#1097](https://github.com/OctoFarm/OctoFarm/issues/1097) ([480bb94](https://github.com/OctoFarm/OctoFarm/commit/480bb94c7a1c9bb60a353330a0fc73ffd933a7f0))
* **client:** fix storage used warning not using storage used for calculation closes [#1108](https://github.com/OctoFarm/OctoFarm/issues/1108) ([95d9835](https://github.com/OctoFarm/OctoFarm/commit/95d98351aed332cbb2ab64345183b50d9bb041d0))
* **client:** fix update octofarm button so it runs restart command after update fixed [#1094](https://github.com/OctoFarm/OctoFarm/issues/1094) ([3e3aced](https://github.com/OctoFarm/OctoFarm/commit/3e3acedfd42d38c1fb37579fd52e12ad9b9f49f8))
* **client:** fixed [#1006](https://github.com/OctoFarm/OctoFarm/issues/1006) - support on/off text based responses for power plugins ([#1007](https://github.com/OctoFarm/OctoFarm/issues/1007)) ([549eea9](https://github.com/OctoFarm/OctoFarm/commit/549eea97f01eadc4a9226eb447bb891023eff75d))
* **client:** fixed [#1013](https://github.com/OctoFarm/OctoFarm/issues/1013) - Type Error when opening print information without ([69078dd](https://github.com/OctoFarm/OctoFarm/commit/69078dd6d08d707941ca3f9f3842356e2151c32a))
* **client:** fixed [#980](https://github.com/OctoFarm/OctoFarm/issues/980) - filamant manager failed to load on fresh installs due to graphs ([6d67b38](https://github.com/OctoFarm/OctoFarm/commit/6d67b386aed55f386e3253620e7f102fb0ec8230))
* **client:** fixed [#985](https://github.com/OctoFarm/OctoFarm/issues/985) - incorrect title tag on group view ([b69e022](https://github.com/OctoFarm/OctoFarm/commit/b69e022ea6fbf632978e50117aa950460a24c93c))
* **client:** fixed [#990](https://github.com/OctoFarm/OctoFarm/issues/990) - filament manager statistics nan% with 0 spooled ([54e82d8](https://github.com/OctoFarm/OctoFarm/commit/54e82d85154593ae321a51ad333f88c3610f25f3))
* **client:** fixes [#1006](https://github.com/OctoFarm/OctoFarm/issues/1006) fix grabbing response from power plugins inc. on/off and true/false returns ([6935125](https://github.com/OctoFarm/OctoFarm/commit/6935125caf8b78c9069a006502bc50b31cec0a66))
* **client:** fixes [#1016](https://github.com/OctoFarm/OctoFarm/issues/1016) don't send connect/power command when selecting a file ([96cf5bf](https://github.com/OctoFarm/OctoFarm/commit/96cf5bf0ab5ae21baf93da20cdd15f9eac1dbc4c))
* **client:** history printer cost total not calculating correctly ([e9241f5](https://github.com/OctoFarm/OctoFarm/commit/e9241f58898902e23eae88a904c0f51f6c7bcaa6))
* **client:** ignore used spools in filament spool manager total table count ([1efa012](https://github.com/OctoFarm/OctoFarm/commit/1efa012e8492dcef6f8d7a5dc2ea969fb570e9b6))
* **client:** re-sync spools options not working on filament manager page ([6966987](https://github.com/OctoFarm/OctoFarm/commit/6966987c9ace4de9c089d8eae9489a3b81c659c7))
* **client:** remove server update ([641ef46](https://github.com/OctoFarm/OctoFarm/commit/641ef46b7a3a2c1732ec4441d89847e587735ed4))
* **client:** spool error causing history page not to load closes [#1111](https://github.com/OctoFarm/OctoFarm/issues/1111) ([799f2a3](https://github.com/OctoFarm/OctoFarm/commit/799f2a3d8b3fe143c31be2ab6418c72f6f582259))
* **client:** tool 0 would always head with bulk pre-heat command [#1083](https://github.com/OctoFarm/OctoFarm/issues/1083) ([2da5961](https://github.com/OctoFarm/OctoFarm/commit/2da59615da77cc8913d2a933c03b536591ea2d6d))
* **client:** update button not correctly disabling when update is available fixed [#1077](https://github.com/OctoFarm/OctoFarm/issues/1077) ([eb9cb76](https://github.com/OctoFarm/OctoFarm/commit/eb9cb763e8c9dba706de7d86d7b6d016e5afe455))
* **client:** usage bar would reset to 0 on page load ([8d2a086](https://github.com/OctoFarm/OctoFarm/commit/8d2a0860f231d40896ff7daf2461546475e41d2b))