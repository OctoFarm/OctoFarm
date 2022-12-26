## [1.8.0-beta.7](https://github.com/OctoFarm/OctoFarm/compare/v1.8.0-beta.6...v1.8.0-beta.7) (2022-12-26)


### :hammer: Bug Fix :hammer:

* **docker:** double build path regression of the regression fix ([75c03cc](https://github.com/OctoFarm/OctoFarm/commit/75c03cc92a5da2a08fa40b5770f6fcfa72a92a6d))

## [1.8.0-beta.6](https://github.com/OctoFarm/OctoFarm/compare/v1.8.0-beta.5...v1.8.0-beta.6) (2022-12-26)


### :hammer: Bug Fix :hammer:

* **docker:** build path regression ([9772b38](https://github.com/OctoFarm/OctoFarm/commit/9772b38e67adfa828f9c1605c1332cdd9fc76986))

## [1.8.0-beta.5](https://github.com/OctoFarm/OctoFarm/compare/v1.8.0-beta.4...v1.8.0-beta.5) (2022-12-26)


### :persevere: Code Refactor :persevere:

* **main:** make docker workflows build tests ([59bfcb5](https://github.com/OctoFarm/OctoFarm/commit/59bfcb5c5372f41a861723cb1ad9b87a32134dbd))


### :hammer: Bug Fix :hammer:

* **docker:** build dockers manually and release with semantic release and version tags ([7845ae0](https://github.com/OctoFarm/OctoFarm/commit/7845ae01a3385d01d371114f601a25b817a71351))
* **docker:** incorrect username/password secrets regression ([076dbfb](https://github.com/OctoFarm/OctoFarm/commit/076dbfbe2b690117e457ab4511e3d73cbffa13df))
* **main:** fix nodejs tests, skip 17 ([7a00611](https://github.com/OctoFarm/OctoFarm/commit/7a0061183015bacc7cc6076da5e23075fef1a72c))

## [1.8.0-beta.4](https://github.com/OctoFarm/OctoFarm/compare/v1.8.0-beta.3...v1.8.0-beta.4) (2022-12-26)


### :curly_loop: Continuous Integration :curly_loop:

* **main:** allow releases from releases/ branch folders, ignore master pushes ([671a55b](https://github.com/OctoFarm/OctoFarm/commit/671a55b7e2e32c9e58d60ca87a506abcf1b99b43))


### :hammer: Bug Fix :hammer:

* **main:** actually run the release package script after client build ([2b9152d](https://github.com/OctoFarm/OctoFarm/commit/2b9152d89efa802973f45f462c056dd1bb8f9ddb))

## [1.8.0-beta.3](https://github.com/OctoFarm/OctoFarm/compare/v1.8.0-beta.2...v1.8.0-beta.3) (2022-12-11)


### :persevere: Code Refactor :persevere:

* **client:** update relative logo uris to be explicit [@mikeymakesit](https://github.com/mikeymakesit) ([#1345](https://github.com/OctoFarm/OctoFarm/issues/1345)) ([b17bfac](https://github.com/OctoFarm/OctoFarm/commit/b17bfac867097f61734d497bcf0ffe2fae330314))

## [1.8.0-beta.2](https://github.com/OctoFarm/OctoFarm/compare/v1.8.0-beta.1...v1.8.0-beta.2) (2022-12-10)


### :curly_loop: What a drag! :curly_loop:

* **main:** finalise master and beta releasing schedule ([#1313](https://github.com/OctoFarm/OctoFarm/issues/1313)) ([599da3e](https://github.com/OctoFarm/OctoFarm/commit/599da3e7c3d14b18760d54c811d0796b7533e602))
* **main:** finalise release mechanism for beta and master ([#1327](https://github.com/OctoFarm/OctoFarm/issues/1327)) ([48f225b](https://github.com/OctoFarm/OctoFarm/commit/48f225b77e26897e1dd621db969fddaa3ed0d63e))


### :persevere: Code Refactor :persevere:

* **client:** language, grammar and text clarity updates [@mikeymakesit](https://github.com/mikeymakesit) ([#1343](https://github.com/OctoFarm/OctoFarm/issues/1343)) ([adc3fad](https://github.com/OctoFarm/OctoFarm/commit/adc3fadcb9464e1f8cd1092d1df86a150d325f1b))

## [1.8.0-beta.1](https://github.com/OctoFarm/OctoFarm/compare/v1.7.3...v1.8.0-beta.1) (2022-10-15)


### :stars: New Feature :stars:

* **client:** show the current page of user on active sessions ([2150123](https://github.com/OctoFarm/OctoFarm/commit/2150123990ed3c993cd7f0edabc2e710c5e27d67))


### :curly_loop: What a drag! :curly_loop:

* **main:** code-ql scanning tool ([db44f19](https://github.com/OctoFarm/OctoFarm/commit/db44f195fbcf6ad28c2fe73727fe67503c75e5bf))
* **main:** create monolithic docker tags for beta/master ([5b2bc7d](https://github.com/OctoFarm/OctoFarm/commit/5b2bc7d4a23d32617b2c66d858c60013b0e772fa))
* **main:** create monolithic docker tags for beta/master ([d82fe20](https://github.com/OctoFarm/OctoFarm/commit/d82fe20b71f4db8d40c28a10e4a2db486452d1fd))
* **main:** create monolithic docker tags for beta/master ([85157ff](https://github.com/OctoFarm/OctoFarm/commit/85157ff51e920608840c6e8465c10bc36d3b15bd))
* **main:** further tweaks to pre-releasing ([38e9fbb](https://github.com/OctoFarm/OctoFarm/commit/38e9fbb3d946ff9d12bb9880d8f9006ab3a7c8f3))
* **main:** further tweaks to pre-releasing ([f267bc0](https://github.com/OctoFarm/OctoFarm/commit/f267bc08a552660dbfd19c6883496c3637c736bc))
* **main:** further tweaks to pre-releasing ([308dfdc](https://github.com/OctoFarm/OctoFarm/commit/308dfdc05cf0adbce5cef267b47f3a980d20727b))
* **main:** refactor release flows for release/** beta/** globs ([b33f081](https://github.com/OctoFarm/OctoFarm/commit/b33f0815f495ab25bb7f9b3507b2f86262c9843b))
* **main:** remove codacy badge ([f22996b](https://github.com/OctoFarm/OctoFarm/commit/f22996b739b4c2285e7d342a026e86058d91c519))
* **main:** replace codacy code scanning tool ([15b01ca](https://github.com/OctoFarm/OctoFarm/commit/15b01ca0176c89e1f14cbde32ccf83468920c94e))

### [1.7.3](https://github.com/OctoFarm/OctoFarm/compare/v1.7.2...v1.7.3) (2022-10-04)


### :persevere: Code Refactor :persevere:

* **client:** change login note ([463c0cd](https://github.com/OctoFarm/OctoFarm/commit/463c0cd71277b6a75666bdbf9df18c12f062ed17))
* **main:** change pre-release branch to beta ([ce753c8](https://github.com/OctoFarm/OctoFarm/commit/ce753c8b1c226b5582979305886203bfd8864c63))


### :curly_loop: What a drag! :curly_loop:

* **main:** remove monolithic docker building for arm ([16dbc35](https://github.com/OctoFarm/OctoFarm/commit/16dbc35c986c686d364ad8015946ccd314bf25b2))


### :hammer: Bug Fix :hammer:

* **server:** use paths for multi-print file list combines instead of file name ([9a4e420](https://github.com/OctoFarm/OctoFarm/commit/9a4e42073600234a3a0ee6d6865246753b52865f))

### [1.7.2](https://github.com/OctoFarm/OctoFarm/compare/v1.7.1...v1.7.2) (2022-10-04)


### :persevere: Code Refactor :persevere:

* **client:** change login note ([6516ff4](https://github.com/OctoFarm/OctoFarm/commit/6516ff4cc2e6b299141d67a77e812ed39a08fb45))
* **main:** change pre-release branch to beta ([977fff7](https://github.com/OctoFarm/OctoFarm/commit/977fff7973ac45eafb6fdc0db15096647b24d7b0))

### [1.7.1](https://github.com/OctoFarm/OctoFarm/compare/v1.7.0...v1.7.1) (2022-10-04)


### :persevere: Code Refactor :persevere:

* **server:** remove old history generate function to force a build ([ac21c3b](https://github.com/OctoFarm/OctoFarm/commit/ac21c3b51def44973de2d120bec02e5938034e97))

## [1.7.0](https://github.com/OctoFarm/OctoFarm/compare/v1.6.9...v1.7.0) (2022-10-04)


### :dress: UI! :dress:

* **client:** added new buttons to history for thumbnail, snapshot and timelapse galleries ([189325a](https://github.com/OctoFarm/OctoFarm/commit/189325a8ad2510609cbfed04b6845db30858b0be))
* **client:** added new buttons to history for thumbnail, snapshot and timelapse galleries ([09e6cc2](https://github.com/OctoFarm/OctoFarm/commit/09e6cc240220874fa94f91db891b3b4bd670f1ca))
* **client:** new on demand gallery modals for thumbnail, snapshot and timelapse buttons ([38feea7](https://github.com/OctoFarm/OctoFarm/commit/38feea72ceaf7a2d7c8c9e5ed4bce5d121c5c996))
* **client:** new on demand gallery modals for thumbnail, snapshot and timelapse buttons ([680ca23](https://github.com/OctoFarm/OctoFarm/commit/680ca23ff77f22a052fba4edede617c34baa3ad0))
* **client:** space out the dashboard system menu better ([df6f6f0](https://github.com/OctoFarm/OctoFarm/commit/df6f6f0739893da986250b3932d9b973ff7aa762))
* **client:** space out the dashboard system menu better ([392d5cd](https://github.com/OctoFarm/OctoFarm/commit/392d5cdbc1d9d7351ffc0a001793918658c9bc3a))


### :stars: New Feature :stars:

* **client:** new full screen camera implementation with print state ([777c87a](https://github.com/OctoFarm/OctoFarm/commit/777c87afe518f2d7bdf83e7299b3482e11faa95e)), closes [#1257](https://github.com/OctoFarm/OctoFarm/issues/1257)
* **client:** new full screen camera implementation with print state ([369cd53](https://github.com/OctoFarm/OctoFarm/commit/369cd5348a0cf50496d31ab081598583212a5b6e)), closes [#1257](https://github.com/OctoFarm/OctoFarm/issues/1257)
* **client:** new gallery modals in history for snapshot, timelapse and thumbnails ([2134a32](https://github.com/OctoFarm/OctoFarm/commit/2134a328d562c8d440e3e38a8b21ceab9420319d))
* **client:** new gallery modals in history for snapshot, timelapse and thumbnails ([d833a9b](https://github.com/OctoFarm/OctoFarm/commit/d833a9ba1c5bcac1635ac28a064bfff4aca4548d))
* **client:** new widget for dashboard page, can be enabled in System -> Dashboard -> Other ([2d8f9bc](https://github.com/OctoFarm/OctoFarm/commit/2d8f9bcacaf6229f22fba2ce165b5081a6e8cf59))
* **client:** new widget for dashboard page, can be enabled in System -> Dashboard -> Other ([6fe7a87](https://github.com/OctoFarm/OctoFarm/commit/6fe7a87f834865024099851bd520aa872d3b4863))


### :hammer: Bug Fix :hammer:

* **client:** history gallery days would always display as today printed ([516ed06](https://github.com/OctoFarm/OctoFarm/commit/516ed060a042a594e40aa426882b71f144691d9b))
* **client:** history gallery days would always display as today printed ([4eb415a](https://github.com/OctoFarm/OctoFarm/commit/4eb415afc782783a16098c27cbd75817940039df))
* **main:** fix yaml syntax on release workflow ([6da0a26](https://github.com/OctoFarm/OctoFarm/commit/6da0a261cdb817abe01aaa8b04f4fbce0fd08143))
* **main:** fix yaml syntax on release workflow ([df40bcd](https://github.com/OctoFarm/OctoFarm/commit/df40bcdde5062e8c07154e9c1ae60e1b3663fe02))
* **server:** try/catch steps after history capture so one doesnt cancel another ([e491080](https://github.com/OctoFarm/OctoFarm/commit/e491080303f601ee39a3b4845757f5d624d802eb))
* **server:** try/catch steps after history capture so one doesnt cancel another ([14bbc7c](https://github.com/OctoFarm/OctoFarm/commit/14bbc7c671e88d78465c2b71611b4fbd4ef6294c))


### :curly_loop: What a drag! :curly_loop:

* **main:** add codacy github action for code scanning and quality check ([67109c9](https://github.com/OctoFarm/OctoFarm/commit/67109c996169cac1cb9f47b3995fc5637d13d675))
* **main:** add codacy github action for code scanning and quality check ([5295a8f](https://github.com/OctoFarm/OctoFarm/commit/5295a8fe23ed0bb48d4038841f9a427763368907))
* **main:** add docker usename and password keys for building ([76e048b](https://github.com/OctoFarm/OctoFarm/commit/76e048b181c8b0571d7ff78e56a24d7ea00117ef))
* **main:** add docker usename and password keys for building ([e05b803](https://github.com/OctoFarm/OctoFarm/commit/e05b803026b45e3ab81073431ebdbdf34e5a9784))
* **main:** allow pre-release on dev ([#1249](https://github.com/OctoFarm/OctoFarm/issues/1249)) ([b7d4273](https://github.com/OctoFarm/OctoFarm/commit/b7d4273e6bfb249e94637b06f50b7860a955cba8))
* **main:** allow pre-release on dev ([#1249](https://github.com/OctoFarm/OctoFarm/issues/1249)) ([9b0443f](https://github.com/OctoFarm/OctoFarm/commit/9b0443f39541b7be37b2b3356f9cb9288710f571))
* **main:** clean old files from build dirs before producing new client build ([7c6a7c8](https://github.com/OctoFarm/OctoFarm/commit/7c6a7c8f95a293e26ab11d3452e9ecd1c5e47002)), closes [#1251](https://github.com/OctoFarm/OctoFarm/issues/1251)
* **main:** clean old files from build dirs before producing new client build ([46066ce](https://github.com/OctoFarm/OctoFarm/commit/46066cebde0e0015a2ec533d63e5d8d487b3c986)), closes [#1251](https://github.com/OctoFarm/OctoFarm/issues/1251)
* **main:** fix path cleaning on ci-di build ([13be0c0](https://github.com/OctoFarm/OctoFarm/commit/13be0c039d83ce8e0017e644625f0494ff4f7f9e))
* **main:** fix path cleaning on ci-di build ([ac2f3fb](https://github.com/OctoFarm/OctoFarm/commit/ac2f3fbe64a45a9f2fca25c76971031594faf02b))
* **main:** general readme tweaks ([28be845](https://github.com/OctoFarm/OctoFarm/commit/28be8454c88d132a86a1767ce255b8ed63c07324))
* **main:** general readme tweaks ([111b65c](https://github.com/OctoFarm/OctoFarm/commit/111b65c1234ee742131a79acf29f39ae2017c811))
* **main:** make sure releases only run on relevant code base changes ([a13dfee](https://github.com/OctoFarm/OctoFarm/commit/a13dfee53199cc25b78baeb11109d9d0a1e16b71))
* **main:** make sure releases only run on relevant code base changes ([951c677](https://github.com/OctoFarm/OctoFarm/commit/951c67703e996b7d9ec009eb343920e423c91f54))
* **main:** move docker builds over to semantic release ([b88f0be](https://github.com/OctoFarm/OctoFarm/commit/b88f0be1f0169bfac7e0c659fbfb0acdc5a34a1d))
* **main:** move docker builds over to semantic release ([b45ebb8](https://github.com/OctoFarm/OctoFarm/commit/b45ebb813bb73e5615dcb1f66caf7e3efd89a015))
* **main:** remove semantic release docker builds ([f61fd2d](https://github.com/OctoFarm/OctoFarm/commit/f61fd2d7d4365adb318c152723ed5a1b76e11118))
* **main:** remove semantic release docker builds ([62ba711](https://github.com/OctoFarm/OctoFarm/commit/62ba7117ad9d1010546a64c7e78951c651c52eff))
* **main:** remove sonar analysis ([0dba474](https://github.com/OctoFarm/OctoFarm/commit/0dba474dece2531b7e4059e0bda080b25f562335))
* **main:** remove sonar analysis ([76506ec](https://github.com/OctoFarm/OctoFarm/commit/76506eceee6d7acb90c4842d8680e9ecea817a41))
* **main:** remove un-required versioning from docker release configuration ([cd83816](https://github.com/OctoFarm/OctoFarm/commit/cd83816828ea415caee24e552a8b3d7c179b73f2))
* **main:** remove un-required versioning from docker release configuration ([1571627](https://github.com/OctoFarm/OctoFarm/commit/15716273332fb1c0fcfbc4f0c994e02ad462f2f3))
* **main:** repair docker builds and image production for development and master ([ee0d9b5](https://github.com/OctoFarm/OctoFarm/commit/ee0d9b58312fc2a3e841a630cff467de0a8605b2))
* **main:** repair docker builds and image production for development and master ([0d11be6](https://github.com/OctoFarm/OctoFarm/commit/0d11be67de3a27528317a40c722818c7c345aaf0))
* **main:** update read me logo path ([#1248](https://github.com/OctoFarm/OctoFarm/issues/1248)) ([34e7139](https://github.com/OctoFarm/OctoFarm/commit/34e71391992ea16e0ee42d1ea35a6fa269f6af46))
* **main:** update read me logo path ([#1248](https://github.com/OctoFarm/OctoFarm/issues/1248)) ([5565879](https://github.com/OctoFarm/OctoFarm/commit/5565879bf74cc103efb149bb18f33613bb8ad970))
* **release:** 1.7.0-development.1 [skip ci] ([213ba95](https://github.com/OctoFarm/OctoFarm/commit/213ba95943f6f83ba3b2bfdbf0d68ada1bf17edf)), closes [#1249](https://github.com/OctoFarm/OctoFarm/issues/1249) [#1248](https://github.com/OctoFarm/OctoFarm/issues/1248)
* **release:** 1.7.0-development.1 [skip ci] ([6e622ac](https://github.com/OctoFarm/OctoFarm/commit/6e622acd3fc526a69ca465de0dbce32455d615c6)), closes [#1249](https://github.com/OctoFarm/OctoFarm/issues/1249) [#1248](https://github.com/OctoFarm/OctoFarm/issues/1248)
* **release:** 1.7.0-development.2 [skip ci] ([11c94e0](https://github.com/OctoFarm/OctoFarm/commit/11c94e0e4734dfb0c0a79cb82660e9704d7614da))
* **release:** 1.7.0-development.2 [skip ci] ([be45e2e](https://github.com/OctoFarm/OctoFarm/commit/be45e2e3a36d205f8b902ee6cc40b684d1669620))
* **release:** 1.7.0-development.3 [skip ci] ([07fe46e](https://github.com/OctoFarm/OctoFarm/commit/07fe46e1e4e8faae1f19d4417b35f606140ca65e)), closes [#1251](https://github.com/OctoFarm/OctoFarm/issues/1251) [#1257](https://github.com/OctoFarm/OctoFarm/issues/1257)
* **release:** 1.7.0-development.3 [skip ci] ([ca49d37](https://github.com/OctoFarm/OctoFarm/commit/ca49d37d44cd9f5177bd76d81ff6a071b7aeb4f4)), closes [#1251](https://github.com/OctoFarm/OctoFarm/issues/1251) [#1257](https://github.com/OctoFarm/OctoFarm/issues/1257)
* **release:** 1.7.0-development.4 [skip ci] ([8db59c7](https://github.com/OctoFarm/OctoFarm/commit/8db59c746801de8b8c0c2dd59697522b0fd3d21a))
* **release:** 1.7.0-development.4 [skip ci] ([efd2d3b](https://github.com/OctoFarm/OctoFarm/commit/efd2d3baddeed5990d7d60fdc6ef9fba75282b54))


### :persevere: Code Refactor :persevere:

* **client:** change dashboard template to allow custom bodys ([a8203cf](https://github.com/OctoFarm/OctoFarm/commit/a8203cf2a0fa8bec43dc5c146781ae7f7f52af1d))
* **client:** change dashboard template to allow custom bodys ([d1971b9](https://github.com/OctoFarm/OctoFarm/commit/d1971b914df44398f5012b06a438cac72a08f2c7))
* **server:** database key value for tracking camera widget ([50fda13](https://github.com/OctoFarm/OctoFarm/commit/50fda13cd09de298a6310e1a4839be8346640676))
* **server:** database key value for tracking camera widget ([8e75cc5](https://github.com/OctoFarm/OctoFarm/commit/8e75cc55e851879de330f54c373d11836ab2c2eb))
* **server:** remove uneeded console logging ([#1281](https://github.com/OctoFarm/OctoFarm/issues/1281)) ([#1282](https://github.com/OctoFarm/OctoFarm/issues/1282)) ([bf0a772](https://github.com/OctoFarm/OctoFarm/commit/bf0a7725f0d82dba64eec64ce5f8593622ec6296))
* **server:** send camera list with dashboard sse data ([203556d](https://github.com/OctoFarm/OctoFarm/commit/203556d1d9fb40b3c0c9b4d19fbb5abd40c346f3))
* **server:** send camera list with dashboard sse data ([9ef240a](https://github.com/OctoFarm/OctoFarm/commit/9ef240a71d623c35d06ed238c69669d2e442f7b3))

## [1.7.0-development.4](https://github.com/OctoFarm/OctoFarm/compare/v1.7.0-development.3...v1.7.0-development.4) (2022-10-04)


### :curly_loop: What a drag! :curly_loop:

* **main:** add codacy github action for code scanning and quality check ([5295a8f](https://github.com/OctoFarm/OctoFarm/commit/5295a8fe23ed0bb48d4038841f9a427763368907))
* **main:** fix path cleaning on ci-di build ([ac2f3fb](https://github.com/OctoFarm/OctoFarm/commit/ac2f3fbe64a45a9f2fca25c76971031594faf02b))
* **main:** general readme tweaks ([111b65c](https://github.com/OctoFarm/OctoFarm/commit/111b65c1234ee742131a79acf29f39ae2017c811))
* **main:** make sure releases only run on relevant code base changes ([951c677](https://github.com/OctoFarm/OctoFarm/commit/951c67703e996b7d9ec009eb343920e423c91f54))
* **main:** remove semantic release docker builds ([62ba711](https://github.com/OctoFarm/OctoFarm/commit/62ba7117ad9d1010546a64c7e78951c651c52eff))
* **main:** remove sonar analysis ([76506ec](https://github.com/OctoFarm/OctoFarm/commit/76506eceee6d7acb90c4842d8680e9ecea817a41))
* **main:** remove un-required versioning from docker release configuration ([1571627](https://github.com/OctoFarm/OctoFarm/commit/15716273332fb1c0fcfbc4f0c994e02ad462f2f3))
* **main:** repair docker builds and image production for development and master ([0d11be6](https://github.com/OctoFarm/OctoFarm/commit/0d11be67de3a27528317a40c722818c7c345aaf0))


### :hammer: Bug Fix :hammer:

* **main:** fix yaml syntax on release workflow ([df40bcd](https://github.com/OctoFarm/OctoFarm/commit/df40bcdde5062e8c07154e9c1ae60e1b3663fe02))

## [1.7.0-development.3](https://github.com/OctoFarm/OctoFarm/compare/v1.7.0-development.2...v1.7.0-development.3) (2022-10-02)


### :curly_loop: What a drag! :curly_loop:

* **main:** add docker usename and password keys for building ([e05b803](https://github.com/OctoFarm/OctoFarm/commit/e05b803026b45e3ab81073431ebdbdf34e5a9784))
* **main:** clean old files from build dirs before producing new client build ([46066ce](https://github.com/OctoFarm/OctoFarm/commit/46066cebde0e0015a2ec533d63e5d8d487b3c986)), closes [#1251](https://github.com/OctoFarm/OctoFarm/issues/1251)
* **main:** move docker builds over to semantic release ([b45ebb8](https://github.com/OctoFarm/OctoFarm/commit/b45ebb813bb73e5615dcb1f66caf7e3efd89a015))


### :dress: UI! :dress:

* **client:** space out the dashboard system menu better ([392d5cd](https://github.com/OctoFarm/OctoFarm/commit/392d5cdbc1d9d7351ffc0a001793918658c9bc3a))


### :persevere: Code Refactor :persevere:

* **client:** change dashboard template to allow custom bodys ([d1971b9](https://github.com/OctoFarm/OctoFarm/commit/d1971b914df44398f5012b06a438cac72a08f2c7))
* **server:** database key value for tracking camera widget ([8e75cc5](https://github.com/OctoFarm/OctoFarm/commit/8e75cc55e851879de330f54c373d11836ab2c2eb))
* **server:** send camera list with dashboard sse data ([9ef240a](https://github.com/OctoFarm/OctoFarm/commit/9ef240a71d623c35d06ed238c69669d2e442f7b3))


### :stars: New Feature :stars:

* **client:** new full screen camera implementation with print state ([369cd53](https://github.com/OctoFarm/OctoFarm/commit/369cd5348a0cf50496d31ab081598583212a5b6e)), closes [#1257](https://github.com/OctoFarm/OctoFarm/issues/1257)
* **client:** new widget for dashboard page, can be enabled in System -> Dashboard -> Other ([6fe7a87](https://github.com/OctoFarm/OctoFarm/commit/6fe7a87f834865024099851bd520aa872d3b4863))

## [1.7.0-development.2](https://github.com/OctoFarm/OctoFarm/compare/v1.7.0-development.1...v1.7.0-development.2) (2022-10-01)


### :hammer: Bug Fix :hammer:

* **client:** history gallery days would always display as today printed ([4eb415a](https://github.com/OctoFarm/OctoFarm/commit/4eb415afc782783a16098c27cbd75817940039df))

## [1.7.0-development.1](https://github.com/OctoFarm/OctoFarm/compare/v1.6.9...v1.7.0-development.1) (2022-10-01)


### :curly_loop: What a drag! :curly_loop:

* **main:** allow pre-release on dev ([#1249](https://github.com/OctoFarm/OctoFarm/issues/1249)) ([9b0443f](https://github.com/OctoFarm/OctoFarm/commit/9b0443f39541b7be37b2b3356f9cb9288710f571))
* **main:** update read me logo path ([#1248](https://github.com/OctoFarm/OctoFarm/issues/1248)) ([5565879](https://github.com/OctoFarm/OctoFarm/commit/5565879bf74cc103efb149bb18f33613bb8ad970))


### :stars: New Feature :stars:

* **client:** new gallery modals in history for snapshot, timelapse and thumbnails ([d833a9b](https://github.com/OctoFarm/OctoFarm/commit/d833a9ba1c5bcac1635ac28a064bfff4aca4548d))


### :hammer: Bug Fix :hammer:

* **server:** try/catch steps after history capture so one doesnt cancel another ([14bbc7c](https://github.com/OctoFarm/OctoFarm/commit/14bbc7c671e88d78465c2b71611b4fbd4ef6294c))


### :dress: UI! :dress:

* **client:** added new buttons to history for thumbnail, snapshot and timelapse galleries ([09e6cc2](https://github.com/OctoFarm/OctoFarm/commit/09e6cc240220874fa94f91db891b3b4bd670f1ca))
* **client:** new on demand gallery modals for thumbnail, snapshot and timelapse buttons ([680ca23](https://github.com/OctoFarm/OctoFarm/commit/680ca23ff77f22a052fba4edede617c34baa3ad0))

### [1.6.9](https://github.com/OctoFarm/OctoFarm/compare/v1.6.8...v1.6.9) (2022-10-01)


### :curly_loop: What a drag! :curly_loop:

* **client:** compile client down with babel support ([46015fb](https://github.com/OctoFarm/OctoFarm/commit/46015fb7fccbe63aa3dc2edaf20e54a0d5d89384))
* **client:** improve babel config ([300ba56](https://github.com/OctoFarm/OctoFarm/commit/300ba56ae2dcbb3123148e89e859a08de6a78e43))
* **main:** add git ignore for new client development path ([719b9b6](https://github.com/OctoFarm/OctoFarm/commit/719b9b64d605d478d3ee73b4021b250347a70f3a))
* **main:** fix development version assets not been found ([5c83d17](https://github.com/OctoFarm/OctoFarm/commit/5c83d1774db81a3804d46451c7c8f5fdc0bc652f))
* **main:** fix eslint rules triggering on top level reserved words ([b91bce4](https://github.com/OctoFarm/OctoFarm/commit/b91bce4583f798540a2da10a97653663819ec6de))
* **main:** update dependencies ([d98cb3e](https://github.com/OctoFarm/OctoFarm/commit/d98cb3e68cc1f9fa7c16ebbc20227f88ac719f74))


### :hammer: Bug Fix :hammer:

* **client:** conflict between current operation id and main views ([1ed2977](https://github.com/OctoFarm/OctoFarm/commit/1ed29776122d4164d45528044f39a2604bd9d4bb)), closes [#1227](https://github.com/OctoFarm/OctoFarm/issues/1227)
* **client:** fix current operations sorting ([4ee3517](https://github.com/OctoFarm/OctoFarm/commit/4ee3517aa4f076ebbdcbca5a3a2f85d0eec73322)), closes [#1218](https://github.com/OctoFarm/OctoFarm/issues/1218)
* **client:** fix dashboard resizing ([ef022a0](https://github.com/OctoFarm/OctoFarm/commit/ef022a0d8d619683adff91826b8a637451bb3cda))
* **client:** incorrect path for background image ([a3091e5](https://github.com/OctoFarm/OctoFarm/commit/a3091e5b1b3f74c620fe9c23c76b0323653dc4db)), closes [#1234](https://github.com/OctoFarm/OctoFarm/issues/1234)
* **client:** unable to create new folders on op client ([61d4653](https://github.com/OctoFarm/OctoFarm/commit/61d4653f76b788441c9af7efe514c4164f246eed)), closes [#1226](https://github.com/OctoFarm/OctoFarm/issues/1226)
* **server:** a failed ip match would still attempt to be read ([89e543f](https://github.com/OctoFarm/OctoFarm/commit/89e543f71f11557892d4bbf7cd4131c7c26ee50e))
* **server:** couldn't parse octopi token when didn't exist ([00ceee7](https://github.com/OctoFarm/OctoFarm/commit/00ceee7eac71c258275210ebabc8af16461008a2))
* **server:** normalise filenames before comparing for uniqeness ([e05c984](https://github.com/OctoFarm/OctoFarm/commit/e05c984ba4650c992e06082ea3e62ac1071c677d)), closes [#1233](https://github.com/OctoFarm/OctoFarm/issues/1233)
* **server:** unable to detach spools from printer ([20c3489](https://github.com/OctoFarm/OctoFarm/commit/20c34893b3e4704005e23e3540440ce946447519)), closes [#1232](https://github.com/OctoFarm/OctoFarm/issues/1232)


### :dress: UI! :dress:

* **client:** split "view" button into "info" and "gallery" ([b3a1b0f](https://github.com/OctoFarm/OctoFarm/commit/b3a1b0f4f16c093a6e17f655505f0ed2ef9d7c89))


### :persevere: Code Refactor :persevere:

* **client:** increase length rounding so smaller values are displayed ([548cc98](https://github.com/OctoFarm/OctoFarm/commit/548cc9811d06bb21334a3c1177bff0c0426f6d6e))


### :x: Removed :x:

* **client:** disable ability to edit and save spool changes ([b584d74](https://github.com/OctoFarm/OctoFarm/commit/b584d74d2132bd777afe51b82eada9622bf6392e)), closes [#1217](https://github.com/OctoFarm/OctoFarm/issues/1217)

### [1.6.8](https://github.com/OctoFarm/OctoFarm/compare/v1.6.7...v1.6.8) (2022-09-24)


### :x: Removed :x:

* **client:** remove filament manage plugin branches from client ([eae5419](https://github.com/OctoFarm/OctoFarm/commit/eae5419b4b7a8408e2a1523084e69ebff66bef63))
* **server:** all filament manager plugin functionality ([57233ad](https://github.com/OctoFarm/OctoFarm/commit/57233ad1af400fb940887eb0430162cde22c5273))
* **server:** disable octofarm api information grab until server can be fixed ([6621388](https://github.com/OctoFarm/OctoFarm/commit/66213883a44ba638ec1ad7a47098d37ce8e453f9))


### :persevere: Code Refactor :persevere:

* **client:** display forwared for ip if available ([8a78587](https://github.com/OctoFarm/OctoFarm/commit/8a78587c5c943136095426f923423a12d328eda2))
* **server:** add in models for spools,profiles and history ([0db0a62](https://github.com/OctoFarm/OctoFarm/commit/0db0a622ac0b9705e79969ae85bd4292b8961eb9))
* **server:** change regex on search to be case-insensitive ([a78e20e](https://github.com/OctoFarm/OctoFarm/commit/a78e20ef759c741f3d4a15029f339795146c40e7))
* **server:** history spool removal ignore at 2.5 minutes, not 1 ([655f610](https://github.com/OctoFarm/OctoFarm/commit/655f61048d8caea6f5af2360bfa15d02903ddd36))
* **server:** include 'colour' key in filament model ([ceb0b8f](https://github.com/OctoFarm/OctoFarm/commit/ceb0b8fb0cf8fa3b0a0387b5bc0d0d8c9f44d88f))
* **server:** migration to finalise removal of filament manager plugin support please see [#1202](https://github.com/OctoFarm/OctoFarm/issues/1202) ([8869eb7](https://github.com/OctoFarm/OctoFarm/commit/8869eb7a436c3239074835314d0e9b159bb72ac7))


### :hammer: Bug Fix :hammer:

* **client:** client drawing blank printers that didn't exist ([8a91598](https://github.com/OctoFarm/OctoFarm/commit/8a91598d273eddeb1f175b34cd8ec8538aaa7faf))
* **client:** multiple button listeners would be added to views ([823c183](https://github.com/OctoFarm/OctoFarm/commit/823c1837c0dadb2dba2605681f82c1cfbe5a134e))
* **client:** printer pages not correctly testing visibility of printer ([7e85d4a](https://github.com/OctoFarm/OctoFarm/commit/7e85d4a057272f86592591737c3017aafdc446c9)), closes [#1192](https://github.com/OctoFarm/OctoFarm/issues/1192)
* **client:** super list view wouldn't update state colour ([ea8cf26](https://github.com/OctoFarm/OctoFarm/commit/ea8cf26e733b3c493c65c9139615a977b77311c8))
* **server:** generating spool information correctly for materials and weight when sending to client ([d71cb53](https://github.com/OctoFarm/OctoFarm/commit/d71cb536000a9cbb4785cd9647a7b92c66cfe2a1))
* **server:** server not correctly attaching spools on old instances ([738615c](https://github.com/OctoFarm/OctoFarm/commit/738615c43c1a41f1e1d338601fab2bc6ffd15457))
* **server:** server would crash when receiving an unexpected response from websocket ([30c2282](https://github.com/OctoFarm/OctoFarm/commit/30c2282bfacbd13d81722d79e40d57dd42b79248))
* **server:** spools were not attaching profiles properly ([cea1c82](https://github.com/OctoFarm/OctoFarm/commit/cea1c82efa03c7396c0cdf02c67e55fe19a5e78d)), closes [#1199](https://github.com/OctoFarm/OctoFarm/issues/1199)


### :curly_loop: What a drag! :curly_loop:

* **client:** re-arranged client files ([e390f24](https://github.com/OctoFarm/OctoFarm/commit/e390f24a319f792e6159a7b2186d9723e321adf0))
* **client:** reorganize and refactor client building ([fc2271b](https://github.com/OctoFarm/OctoFarm/commit/fc2271b0f2a756e0ff1e64fcf804d908469d1e26))
* **client:** replace file path for dashboard css ([350db82](https://github.com/OctoFarm/OctoFarm/commit/350db822519f93f1d1ecad9fb2056db2c9bba93e))
* **client:** replace some images paths for new server path ([ed197c5](https://github.com/OctoFarm/OctoFarm/commit/ed197c58cda61a5c5486a9009da92c4a1104614c))
* **docker:** trigger docker builds after new release method ([5caf24e](https://github.com/OctoFarm/OctoFarm/commit/5caf24eb484e4203d6e07f1f27e79406ce880c97))
* **main:** added note to readme about octofarm website issues ([f0dd0c0](https://github.com/OctoFarm/OctoFarm/commit/f0dd0c07988d715d100ad6f5f60da8b42b54fdd7))
* **main:** fix incorrect token on release ([4a2b62a](https://github.com/OctoFarm/OctoFarm/commit/4a2b62a18b0e3e35d17dafcce409e3e3c90e518b))
* **main:** fix release deps not installing ([029cb1f](https://github.com/OctoFarm/OctoFarm/commit/029cb1f3f8ece0d5a8ccf2ba625809a6d737af35))
* **main:** readme type-o ([8223b10](https://github.com/OctoFarm/OctoFarm/commit/8223b101dab954835cff4bf47e8fbd18fc0be109))
* **main:** simplify issue report ([2af5ba1](https://github.com/OctoFarm/OctoFarm/commit/2af5ba10c37e4e7cb8ad7db0d8a328a664a30d8a))
* **main:** swap release-it with semantic-release ([073b17e](https://github.com/OctoFarm/OctoFarm/commit/073b17e9cf54219aa31ae6bcd79a78adf0d6f3dc))
* **main:** updated eslint configuration ([125a26f](https://github.com/OctoFarm/OctoFarm/commit/125a26f5351817bf6034de654efc16624dc2315e))

# :octopus: :octopus: OctoFarm's Changelog :octopus: :octopus:

### [1.6.6](https://github.com/OctoFarm/OctoFarm/compare/1.6.5...1.6.6) (2022-09-04)


### :x: Removed :x:

* **server:** tidy up some unneeded logging ([a527121](https://github.com/OctoFarm/OctoFarm/commit/a527121ed1aeec44584b497f9bc85811b9bf2bc9))


### :hammer: Bug Fixes :hammer:

* **client:** current operations wasn't updating finish time ([2b54563](https://github.com/OctoFarm/OctoFarm/commit/2b5456305074be2d22e919c637077afe6073b0aa))
* **client:** don't allow graph generation without data ([3fe697c](https://github.com/OctoFarm/OctoFarm/commit/3fe697c99f6dcd1d21d591d3953e517dd1159316)), closes [#1193](https://github.com/OctoFarm/OctoFarm/issues/1193)
* **server:** failing to parse octopi json data ([8ae5ede](https://github.com/OctoFarm/OctoFarm/commit/8ae5ede13372f9e7e11639390697d4cb20d858c7))
* **server:** force re-auth for socket ([6fcabb3](https://github.com/OctoFarm/OctoFarm/commit/6fcabb36391bb14ae6ce5999f1d58d0b66ca0fcd)), closes [#1163](https://github.com/OctoFarm/OctoFarm/issues/1163)
* **server:** octopi information retrieval ([78bda4d](https://github.com/OctoFarm/OctoFarm/commit/78bda4dcce4b55e160a4b77533907ce5b571a180))
* **server:** refactored filament manager sync ([2cec91a](https://github.com/OctoFarm/OctoFarm/commit/2cec91acb7d957188353e98571ef52994b7fd7a9)), closes [#1194](https://github.com/OctoFarm/OctoFarm/issues/1194)


### :dash: Code Improvements :dash:

* **client:** add correct placeholder value for connect/disconnect after power settings ([43aef08](https://github.com/OctoFarm/OctoFarm/commit/43aef08e7df59c1f980d1b811477398366dbf25c))
* **client:** add in helper notification for connection sequence ([5896c2f](https://github.com/OctoFarm/OctoFarm/commit/5896c2face11cf38e6fba84745b6cc470a56f426))
* **client:** refactor informaiton generation ([e9174ab](https://github.com/OctoFarm/OctoFarm/commit/e9174ab71e25f81d0c76ce83d7552e07dbfcdfae))
* **client:** update correct command example for psu control state ([c1a9317](https://github.com/OctoFarm/OctoFarm/commit/c1a931745576716b19d17acc04904f781383d93b))
* **server:** always grab session key before authenticating websocket ([429cbc4](https://github.com/OctoFarm/OctoFarm/commit/429cbc43d417cbd7a6fb25bec6103a90184a1ff5))
* **server:** disregard offline/setting up printers on health checks ([6831755](https://github.com/OctoFarm/OctoFarm/commit/68317554a557bfe6fef691103a174b67c8d85225))

### [1.6.5](https://github.com/OctoFarm/OctoFarm/compare/1.6.4...1.6.5) (2022-08-07)


### :curly_loop: Continuous Integrations :curly_loop:

* **main:** run client builds as part of release it after bump hook ([#1187](https://github.com/OctoFarm/OctoFarm/issues/1187)) ([9f8c6ef](https://github.com/OctoFarm/OctoFarm/commit/9f8c6ef268a2b37508236756f24d97302600da72))

### [1.6.4](https://github.com/OctoFarm/OctoFarm/compare/1.6.3...1.6.4) (2022-08-07)


### :hammer: Bug Fixes :hammer:

* **server:** make sure name isn't regenerated when exists ([#1186](https://github.com/OctoFarm/OctoFarm/issues/1186)) ([77259e3](https://github.com/OctoFarm/OctoFarm/commit/77259e3f52d50c77e67a0522367e793338866d2e))

### [1.6.3](https://github.com/OctoFarm/OctoFarm/compare/1.6.2...1.6.3) (2022-08-07)


### :curly_loop: Continuous Integrations :curly_loop:

* **main:** yet again force client and server builds ([#1185](https://github.com/OctoFarm/OctoFarm/issues/1185)) ([7846dc5](https://github.com/OctoFarm/OctoFarm/commit/7846dc50ca3ef0fc5d0739d8537218d285a623e2))

### [1.6.2](https://github.com/OctoFarm/OctoFarm/compare/1.6.1...1.6.2) (2022-08-07)


### :hammer: Bug Fixes :hammer:

* **client:** fix building of sse client ([#1183](https://github.com/OctoFarm/OctoFarm/issues/1183)) ([1b733b3](https://github.com/OctoFarm/OctoFarm/commit/1b733b3754e244ef791144f1d8ed6a100fad9854))


### :curly_loop: Continuous Integrations :curly_loop:

* **client:** make sure client build is committed after build ([aa5c10c](https://github.com/OctoFarm/OctoFarm/commit/aa5c10ce5cfb8882a9df1f3cfe880f0ef9da76fd))
* **main:** make sure to commit client to build ([29703ab](https://github.com/OctoFarm/OctoFarm/commit/29703ab58fc63772eb75b3e77dbf573d19513c14))

### [1.6.1](https://github.com/OctoFarm/OctoFarm/compare/1.6.0...1.6.1) (2022-08-07)


### :curly_loop: Continuous Integrations :curly_loop:

* **main:** allow distribution folder for client to be commited ([04cb94e](https://github.com/OctoFarm/OctoFarm/commit/04cb94e69d42e51de599d512f21d92ee10563004))


### :hammer: Bug Fixes :hammer:

* **server:** fix printer name issue with database migration from old value, closes [#1176](https://github.com/OctoFarm/OctoFarm/issues/1176) [#1179](https://github.com/OctoFarm/OctoFarm/issues/1179) [#1180](https://github.com/OctoFarm/OctoFarm/issues/1180) [#1178](https://github.com/OctoFarm/OctoFarm/issues/1178) ([90e8456](https://github.com/OctoFarm/OctoFarm/commit/90e84560be1b41648ba2c8fbfb853a2b50db4941))
* **server:** make sure printer name is generated properly if OP name is blank ([235f07c](https://github.com/OctoFarm/OctoFarm/commit/235f07cee2860e069e3a156b1a720cd795ad5abb))

## [1.6.0](https://github.com/OctoFarm/OctoFarm/compare/client-1.5.1...client-1.6.0) (2022-08-06)


### :dash: Code Improvements :dash:

* **client:** add fallback for user printing to OP user, closes [#1144](https://github.com/OctoFarm/OctoFarm/issues/1144) ([46c1235](https://github.com/OctoFarm/OctoFarm/commit/46c12353af8fbd14792cc5dea1beda66113b1961))
* **client:** display printers last connection status on table row ([9742436](https://github.com/OctoFarm/OctoFarm/commit/97424369b92306df8127337728ab96a34d620d7f))
* **client:** monitoring views check client is in viewport before updating any data ([3bb4d74](https://github.com/OctoFarm/OctoFarm/commit/3bb4d749acee23500b0389d8034244a96d529635))
* **client:** re-organise terminal view to better fit modal ([60c2835](https://github.com/OctoFarm/OctoFarm/commit/60c2835707edf8e2aad97ec8fc875f5fe5638d38))
* **client:** replace map functionality with forEach for printer draws ([3e751e8](https://github.com/OctoFarm/OctoFarm/commit/3e751e8c9037dedfb872f8b6a1da60fb3274618d))
* **server:** replace testing the waters check with ping to host/port
* **server:** refactor printer onboarding to utilise configuration file
* **server:** handle testing the waters part of printer configuration
* **server:** turning OctoPrint API into simple configuration file
* **server:** remove settingsAppearance / name coupling
* **server:** make sure Complete state is considered "Active" by websocket checks
* **server:** remove text-dark from info status
* **server:** don't allow ping when readyState on websocket not 1
* **server:** initial onboarding for printers from configuration file, closes #1165 #1102 #1157

### :stars: New Features :stars:

* **client:** actually power off printer if available with quick disconnect, closes [#1156](https://github.com/OctoFarm/OctoFarm/issues/1156) ([7ae7530](https://github.com/OctoFarm/OctoFarm/commit/7ae753023df3006dffefb32020a2c35085e54a74))
* **client:** allow configuration of to quick connect setting, closes [#1151](https://github.com/OctoFarm/OctoFarm/issues/1151) ([223ce66](https://github.com/OctoFarm/OctoFarm/commit/223ce6630da15b8cf4fc18b48685fdd732d9b5c9))
* **client:** implement a modal switcher for the job,files,control and terminal modal on monitoring ([fe69921](https://github.com/OctoFarm/OctoFarm/commit/fe69921ae4c4cf5470ca6a084620010eef4a2ef5))
* **server:**  allow configuration of to quick connect setting, closes #1151

### :x: Removed :x:

* **client:** environmental history option for dashboard ([4a42cfd](https://github.com/OctoFarm/OctoFarm/commit/4a42cfdad1da02fdf53081a46575ce72aa6de859))
* **client:** remove deprecated api information scan option ([fa38db5](https://github.com/OctoFarm/OctoFarm/commit/fa38db515ca9831ab42f2d00a04a26d5ab16ce58))
* **server:** stop docker builds on arm, dependency causing builds to fail

### :hammer: Bug Fixes :hammer:

* **client:** api issues would incorrectly trigger on setting up... state ([9c5b46e](https://github.com/OctoFarm/OctoFarm/commit/9c5b46e37582fd4fea3ff6814c993072eb6b742e))
* **client:** displaying api scanning issues when optional api data missing ([9e385da](https://github.com/OctoFarm/OctoFarm/commit/9e385da253147f70c30434b617e5837efb46b6e7))
* **client:** not been able to enable current operations on dashboard, closes [#1162](https://github.com/OctoFarm/OctoFarm/issues/1162) ([d10e748](https://github.com/OctoFarm/OctoFarm/commit/d10e748a5b5ba6eee3b4253e924465e1269c6c53))
* **client:** trying to update the non existant power badge on file manager, closes [#1168](https://github.com/OctoFarm/OctoFarm/issues/1168) ([eb2359f](https://github.com/OctoFarm/OctoFarm/commit/eb2359f2b2894b72ae4b94caf8d1689941068356))
* **server:** server not recognising "Printing from SD" state, closes #1164
* **server:** remove spool assignments from deleted printers, closes #1155
* **server:** setting up state would try to call PowerStatus command
* **server:** not registering failed attempts at API calls to the connections overview
* **server:** not generating settings cache on new user creation, closes #1172
* **server:** filament manager plugin spools not resyncing after finish printer, closes #1169
* **server:** checking for filament manager plugin settings when printer doesn't have them


### [1.5.1](https://github.com/OctoFarm/OctoFarm/compare/client-1.5.0...client-1.5.1) (2022-06-29)

### :dash: Code Improvements :dash:
* **server:** make sure to break out of user loop if no octofarm derivative user found (https://github.com/OctoFarm/OctoFarm/pull/1149#:~:text=make%20sure%20to,%E2%80%A6designation%20found)
  …designation found
* **server:** Make camera proxy enabling restart required, closes #1148 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/c51ea07add6c60f987e215a286fe93c907fe431c)
* **server:** better re-organise system tasks so they're safer and more consistently run (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/41a2ebd0d728ca598bfaa7584a78c3f7d3cb1beb)
* **server:** improve server boot task completion time (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/f003f50964e96b262a6537f9cdafd270c956418c)

### :curly_loop: UI :curly_loop:

* **client:** add restart required text to camera proxy enable ([d1d6dec](https://github.com/OctoFarm/OctoFarm/commit/d1d6dec3d4ed16f4c197fe22c14630d385fd3aae))
* **client:** fix incorrect hover description for quick connect states, closes [#1143](https://github.com/OctoFarm/OctoFarm/issues/1143) ([00191a1](https://github.com/OctoFarm/OctoFarm/commit/00191a15968b3d91633d9806efd0240d2c3b1d83))
* **client:** improve display of task list in system ([0a3fa4c](https://github.com/OctoFarm/OctoFarm/commit/0a3fa4c08611fe2c94540c0585b45119bc557450))

### :hammer: Bug Fixes :hammer:

* **client:** current operations page would not load due to service change ([b5f26be](https://github.com/OctoFarm/OctoFarm/commit/b5f26bef20e4356a5feb9eb8d46834984f65f4ad))
* **client:** updating cameras inside modals when proxy is enabled, closes [#1152](https://github.com/OctoFarm/OctoFarm/issues/1152) ([90915ae](https://github.com/OctoFarm/OctoFarm/commit/90915ae6ffcddc6c5f62ae2c34dc3363740b40b9))
* **server:** memory rounding issue causing incorrect percentage to display (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/df6d624637c3c0420dcfbbb747768c799404ea06)
* **server:** Not using correct information for generating file information states, closes #1145 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/136ac0a732b05cacbbb89c8c14f98324d34fe5d6)
* **server:** Editing printers showed backend url not user inputted, closes #1142 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/a1b031be156a5e53d56f977ca619d2d5358188a7)
* **server:** Not correctly dealing with database and captured printer profile information, closes #1102 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/cb1439538eee092dd7dd475f918ee54451f441c9)
* **server:** server connection failing when user not an "octofarm" derivative, closes #1141 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/3d42f495ab6c2f63148e5a3ee692cfe23b4856df)


### :dash: Code Improvements :dash:

* **client:** improve cache busting without relying on ?version, closes [#1147](https://github.com/OctoFarm/OctoFarm/issues/1147) ([a1d4844](https://github.com/OctoFarm/OctoFarm/commit/a1d48448e65bcc9deff7f5a2ef646e116295c5c9))
* **client:** improve loading speed of views, closes [#1146](https://github.com/OctoFarm/OctoFarm/issues/1146) ([68a3c4e](https://github.com/OctoFarm/OctoFarm/commit/68a3c4ed552c22780c71675c44bfe0e3e757d2f8))

## [1.5.0](https://github.com/OctoFarm/OctoFarm/compare/client-1.4.1...client-1.5.0) (2022-06-25)


### :dash: Code Improvements :dash:

* **client:** allow views with cameras to update webcam snapshot on demand ([a3fb638](https://github.com/OctoFarm/OctoFarm/commit/a3fb6386675b0e858a1825018481afb519061d28))
* **server:** [send current octoprint user to printer manager](https://github.com/OctoFarm/OctoFarm/pull/1132/commits/13d62ab38f93ce832b9fe8800b35f8d1ab586b4a)


### :stars: New Features :stars:

* **client:** client can activate/deactive camera proxy, default is deactivated ([edaa208](https://github.com/OctoFarm/OctoFarm/commit/edaa208b4dc6c68a85ff264c5d2931a62e8ecb50))
* **client:** global display option for camera aspect ratio deafult,1x1,4x3,16x9 ([8cdac70](https://github.com/OctoFarm/OctoFarm/commit/8cdac70b00e6c51e78b870c801261b4316020c98))
* **client:** show current OctoPrint and Active Control users on Printer Manager ([20a40a1](https://github.com/OctoFarm/OctoFarm/commit/20a40a1b80a7eb5129e5921366ba5d0f0e209228))
* **server:** [proxy mjpeg stream to client](https://github.com/OctoFarm/OctoFarm/pull/1132/commits/2d107eb85f688a026131c478be2f97236405aadf)


### :curly_loop: UI :curly_loop:

* **client:** fix incorrect message on bulk shutdown,reboot of octoprint host ([32e07be](https://github.com/OctoFarm/OctoFarm/commit/32e07bee7d72a1c5a099a49564d284132e074ed3))


### :x: Removed :x:

* **client:** cost and filament usage sort option for now closes [#1138](https://github.com/OctoFarm/OctoFarm/issues/1138) ([5bb9eff](https://github.com/OctoFarm/OctoFarm/commit/5bb9eff752139bbf2b43c3417566426a5d73d857))


### :hammer: Bug Fixes :hammer:

* **client:** bulk printer control not using proxy url if set ([0b310e5](https://github.com/OctoFarm/OctoFarm/commit/0b310e5cd9a0679606c3256da8cc1af2a227c41e))
* **client:** error on updating file thumbnail through octoprint proxy ([9367d7f](https://github.com/OctoFarm/OctoFarm/commit/9367d7f40de26111a8e26608ed25fb262a440a28))
* **client:** showing "done" when in fact its 0 seconds ([cd69f19](https://github.com/OctoFarm/OctoFarm/commit/cd69f190736ecf1fdc3fb4e242e3d9c1a7635288))
* * **server:** [not saving Estimated Life Span settings for printer cost settings](https://github.com/OctoFarm/OctoFarm/pull/1132/commits/7c65250f4d75dd3ca9ae218f92c5c18ee0d0d2aa)

### [1.4.3](https://github.com/OctoFarm/OctoFarm/compare/1.4.2...1.4.3) (2022-06-24)

### :hammer: Bug Fixes :hammer:

* **server:** fix octoprint proxy 404 ([4753109](https://github.com/OctoFarm/OctoFarm/commit/4753109ea4bca981cc955a129a700071b8327761))


### [1.4.2](https://github.com/OctoFarm/OctoFarm/compare/client-1.4.1...1.4.2) (2022-06-24)

### :x: Removed :x:

* **server:** mjpeg proxy whilst i can figure out 4 stream limit](https://github.com/OctoFarm/OctoFarm/pull/1128/commits/0470db95ef9c322f0a23769b23ac497b1268b66c)


### [1.4.1](https://github.com/OctoFarm/OctoFarm/compare/1.4.0...1.4.1) (2022-06-24)

### :persevere: Code Refactors :persevere:
* **server:** added in logging for camera and octoprint proxy (https://github.com/OctoFarm/OctoFarm/pull/1118/commits/63a715b4f480a68eb5856c95ead0f43998cc0a0c)
* **server:** move client side power checking to server(https://github.com/OctoFarm/OctoFarm/pull/1118/commits/1f0020ded2a47dcc22278296883f2deb52ccb70c) https://github.com/OctoFarm/OctoFarm/issues/1117


### :hammer: Bug Fixes :hammer:

* **client:** filament manager wouldn't load all spools on subsequent printers closes [#1127](https://github.com/OctoFarm/OctoFarm/issues/1127) ([3d5ae43](https://github.com/OctoFarm/OctoFarm/commit/3d5ae439e321d0ed1be591c5f7c029cc1dfbf429))
* **server:** server wan't sending storage information to client ([aba0109](https://github.com/OctoFarm/OctoFarm/pull/1118/commits/aba010998851123aad62c0e738b1f5ff6d83e4c6))

### [1.4.0](https://github.com/OctoFarm/OctoFarm/compare/1.4.0...1.4.1) (2022-06-24)

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
* **server:** create /camera/ endpoint to proxy cameras through ([8f0e89a](https://github.com/OctoFarm/OctoFarm/commit/8f0e89a11ef8cd3a27873f2fd7b3342d9a5eedb7))
* **server:** create /octoprint/ endpoint to proxy all octoprint requests through ([c4e17f7](https://github.com/OctoFarm/OctoFarm/commit/c4e17f7bbb7ccfc7d9f8eda04b85b86470520b46))
* **server:** create convert service from camURL => clientCamURL for camera proxy ([31b162a](https://github.com/OctoFarm/OctoFarm/commit/31b162a18d0dc716de96b47c2d7538143a7653af))
* **server:** remove CORS check and warning no longer needed ([5875e81](https://github.com/OctoFarm/OctoFarm/commit/5875e8125a152d16703175f53852be3d8bf3344e))
* 
### :stars: New Features :stars:

* **client:** allow user to add current operations to printers, history, file and filament manager ([b5bddea](https://github.com/OctoFarm/OctoFarm/commit/b5bddea47ab6cc2cf7256db99f828ec1eff87724))
* **client:** redirect all octoprint commands through the octofarm proxy ([9a16b5c](https://github.com/OctoFarm/OctoFarm/commit/9a16b5cff05b440ab67295e01236568f52b9ae35))
* **server:** proxy cameras through octofarm server ([cec5c85](https://github.com/OctoFarm/OctoFarm/commit/cec5c85a78a7ba35c4f7c84d10488b2dcd7fce06))
* **server:** redirect all file uploads through the octofarm proxy ([b5dfeb2](https://github.com/OctoFarm/OctoFarm/commit/b5dfeb2d106f4dc8f8b1f91f51a4e36c106bea4c))
* 
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
* **server:** allow inputting blank group name in printer edit closes [#1096](https://github.com/OctoFarm/OctoFarm/issues/1096) ([439cf67](https://github.com/OctoFarm/OctoFarm/commit/439cf67d7aaa6aef466b031bff768e3b54a645b6))
* **server:** fix initial grab of supported plugin data and octoprint name ([ff67914](https://github.com/OctoFarm/OctoFarm/commit/ff6791491d00353cbef604c799f10f25290c6efb))
* **server:** grab installed client version from package-lock fixed [#1107](https://github.com/OctoFarm/OctoFarm/issues/1107) ([873dd9c](https://github.com/OctoFarm/OctoFarm/commit/873dd9c2f4aab26e8e4262aff9e075bd0e304f55))


# SERVER CHANGELOG
[Server changelog](https://github.com/OctoFarm/OctoFarm/blob/master/server/CHANGELOG.md)

# CLIENT CHANGELOG
[Client Changelog](https://github.com/OctoFarm/OctoFarm/blob/master/client/CHANGELOG.md)

# :octopus: :octopus: OctoFarm's Old Changelog :octopus: :octopus:

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


## [v1.2.3]

### Fixed
  - Fixed #985 - Inaccurate tooltip on group link on navigation bar 
  - Fixed #995 - Saving printer settings without toggle causes client error to throw due to missing "status" key
  - Fixed #992 - Clear active user on printer when "Completed" print is triggered
  - Fixed #998 - Websocket throttle does not take into account printer state
  - Fixed #1006 - Support responses with on/off values for power plugins
  - Fixed - Drag and drop uploads been allowed to offline printers
  - Fixed #1003 - Offline state is not picked up correctly by manage dropdowns on printer manager
  - Fixed - Current Operations not correctly creating substring from filename
  - Fixed #976 - Client error when all printers not onboarded due to current operations
  - Fixed #991 - Dragging and dropping file onto printers subverts user capture action
  - Fixed #975 - OctoFarm doesn't re-attempt user grab on second connection attempt, after failing the first time
  - Fixed #999 - Error when selecting "No Spool" with filament manager plugin setup
  - Fixed - Unable to Re-Sync spools / profiles from Filament Manager plugin
  - Fixed - Filament manager plugin sync trying to connect to "Offline" printer

### Changed
  - Changed - Added more logging to the OctoPrint api connection service
  - Changed - Moved "API Re-Scan" to "OctoPrint Manager" dropdown
  - Changed #988 - Renamed "API Re-Scan" -> "Update Information"
  - Changed - Quick Actions dropdown header "Commands" -> "Printer Commands"
  - Changed - Moved Power On/Off Printer Options into "Printer Commands" section
  - Changed - Default API timeout is now 5000ms

### Added
  - Added - More information to what API Re-Scan/Update Information does on the modal
  - Added - Separators between sections on dropdown
  - Added - Cache busting to the server, should help with any js/css changes going forward
  - Added - Forced check for V1.2.x filament manager plugin changes. Requires Re-Sync of your spools.

### Removed
  - Removed - Option to input Power toggle as it's no longer used by the system nor UI


## [v1.2.2]

### Fixed
  - Fixed #962 - Re-Fix as I never applied the original fix... Dockers now load system page
  - Fixed - "Running under docker" not displaying on the system information page
  - Fixed - "Github Branch" not displaying "Not a repository" when so

### Changed
  - Changed the version display on the nav bar so it displays on master versions as well as beta/alpha

## [v1.2.1]

### Fixed
  - Fixed #963 - Some OctoPrint endpoints would timeout due to slower responses to the others
  - Fixed #970 - Main docker image fails to start due to missing paths
  - Fixed #966 - Can't bulk disable offline printers because they don't display
  - Fixed #965 - iFrame no longer worked due to regression. This is a patch, it will be disabled again in a future release and you will be required to update your .env file.
  - Fixed #962 - System page doesn't load on docker installs due to not been a git repository

## [v1.2]

### Added

  - Added #546: Node 13 or lower issue webpage with instructions, doesn't restart server anymore
  - Added #509: HTTP/HTTPS support for websocket connections
  - Task scheduler: runs periodic tasks for OctoFarm in a controllable, periodic manner.
  - Added line counter to ticker log
  - Refactored task manager so it becomes easier to use
  - Global Client Error Handler: Grabs any errant / uncaught errors and displays a modal
  - Bulk actions will now produce a modal to track the actions which produces a status and message. This replaces the alert notification that flooded the screen previously.
  - Added #607: The user Octofarm connects with is now no longer static... You can open the settings modal and change the user OF connects with. It's still automatically selected on boot.
  - Added #295: Support for DisplayLayerProgress plugin. The List, Panel, Camera and Printer Manager views all now display this information if it's available. Works automatically on detection of the plugin!
  - Added #761: All filament selection boxes now show manufacture.
  - Added #763: Allow file multi-upload to create folders if they don't exist.
  - Added a new Actions Bar to views. These contain filters and bulk commands for controlling printers.
  - OctoFarm now listens on the websocket for Plugin/System updates. After a command is fired for updating you will see a "Restart Required" flag in Printer Manager for the printer that requires it.
  - OctoPrint plugin / software update actions are printed to the Connection Logs in printer manager.
  - Added #762: Current Operations may now be sorted. Sorting is remembered on server side and resets with a server reset currently. You can sort by progress/time remaining/file name/printers sort index in ascending and descending.
  - Added a new option to the new action bar: Multi-Print!
    - Multi-Print is for starting... multiple prints. It also takes care of checking if your printer is "Operational", uploading the file if it doesn't exist and actioning the print.
    - There are two modes, based on how many files you upload.
    - Single file mode: Detected when you select only 1 file. This will upload that file to all the selected printers.
    - Multi file mode: Detected when you select more than 1 file. This will upload those files, one by one in a round-robin to each printer. This works best with the same amount of files and printers. More printers than files, or more files than printers will result in some been missed off... It's not very smart!
  - New server side settings to enable and disable any monitoring views... You can now turn on/off each view in System -> Server -> Monitoring Views.
  - Added #299: New View combined mode, is a bulked out list view. Pretty much a combination of Panel/List/Camera views rolled into one super view.
  - New section in System for Release Notes. This will display the current version changes from the previous version.
  - New user CRUD endpoints: /users/users. Required administrator rights to access.
  - New system tab called "Users". Can created, edit, read, update all users. There is also a password reset option.
  - You can now see UserLoggedIn/UserLoggedOut/ClientAuthed/ClientClosed events for OctoPrints websocket and user interface in the Printer Managers connections log.
  - New columns setting for the Group Views, added in System -> Client -> Views. 
  - Added Another new view named "Group". Group view will organise your printers by their common groupings. This view is great for fire and forget type farms.
    - Group view will action on Print/Pause/etc commands for all printers in the group. 
    - There is a special cut down file list you can bring up that collates all available files on each printer in the group. You may start prints from here. Note: There is no folders and the list may get large. The file name becomes the path to halp see which file is which. Search isn't available yet. 
  - Added a quick setup button for Filament Manager Plugin in System. This will run through all online instances and set the up with the database settings you provide.
  - Filament manager can now clone spools. Pressing the button will insert a new row defaulting to 1000g and 0g usage. The name will be incremented with (#).
  - System manager can now view the running OctoFarm tasks.
  - HistoryRoutes now has server side pagination, should reduce resources some and make the history page load snappier.
  - Any history data requests are now filtered starting from the first day of the last month. You should see at least 1
    months worth of data( when available ) as well as any from the current month.
  - Filament Manager has some new settings in System -> Server -> Filament Manager:
      - Hide Empty Spools: If enabled this will hide empty spools from the spool selection dropdowns and also the main
        printer list. They are still visible in the Spool Manager. (with or without OP Filament Manager Plugin).
      - Downdate successful usage: If enabled history will attempt to take the OctoPrints gram calculation and add it to
        the amount used on the currently selected spool.  (only without OP Filament Manager Plugin).
      - Downdate failed/cancelled usage: If enabled history will calculate the percentage through a print and using
        OctoPrints gram calculation add it to the amount used of the currently selected spool. (only without OP Filament
        manager Plugin).
  - New detection for multiple user OctoPrint setups. If your user is named "OctoFarm" / "octofarm" & an Administrator it
    will automatically choose this user to use.
  - Graceful shutdown to OctoFarms service. The app will not close all tasks, printer connections and database connections
    before killing itself.
  - Added the ability to set the logging level by environment variables. Example: LOG_LEVEL=info. Accepted
    values=info,debug,silly
  - New alerts section on printer manager, moved all the OP updates, and printer issues to here with their own dedicated
    icon and action button.
  - New button to do a Re-Scan and of OctoPrint's API. This is to update information from OctoPrint ->
    OctoFarm. Does nothing to your websocket connection.
  - New button to do a websocket reconnect if one is available. It will close the socket and re-open to refresh.
  - New websocket management system that keeps itself sustained. Should not require re-connecting to it at all unless
    purposefully closed.
  - Added git repo information to system page, and also added git check for update commands.
  - Printer manager now has a ticker for the printer alerts. Displays planned websocket/api scans, octoprint updates, plugin updates and more.
  - Add current Miliseconds since Jan 1970 string to log dump zip name.
  - Made enhancements to the log system:
    - Logs now show created date, as well as modified.
    - Log files can now be deleted.
    - Additional button to house keep log files. Cleans any logs older than a day.
  - Added support for additional file types. These should allow the further support of OctoPrint-BetterGrblSupport Plugin and OctoPrint-Chituboard Plugin ".gcode,.gco,.g,.ctb,.fdg,.nc,.gc" - Added to docs.octofarm.net 
  - Active sessions now viewable on System -> System Information page.
  - All print start buttons, File Manager and Views now check if the printer is turned on (if available) and connected. 

### Changed
  - Completely reworked history cache, prepared and tested for OctoFarm V2
  - Slightly reworked file cache, prepared for V2 and made it robust - "robust"
  - Made API tests less prone to unnecessary failure
  - Reworked the Settings modal to be more resilient to failure and cleaned up code
  - Slightly reworked job cache, prepared for V2
  - Added the ability to override the automatic wss:// select for HTTPS in printer settings modal.
  - Added the ability for settings dialog to return to "Printer Online" view when printer comes online in background / from settings changes.
  - Amended the functions for Global OctoPrint update and Global OctoPrint plugin update
  - The core `state` of OctoFarm is split off of OctoPrint and added possibilities to test it fully
  - Rewrote imports and entrypoint of frontend javascript for webpack
  - Added Webpack to replace Gulp frontend bundler
  - Rewrote dashboard page and completely refactored javascript code in browser
  - Moved filament cleaner startup to app-core
  - Made NODE_ENV to be production by default causing the @octofarm/client bundle to be loaded and console logging to be filtered with level INFO/ERROR
  - File manager: gave printer titles a badge. Gave selected printer a yellow border.
  - Refactor of HistoryRoutes Runner with new OctoPrint Client service and added test coverage.
  - Refactor of Printer Manager client view templates. All Manager functions under seperate dropdowns, wider connection log.
  - Refactor of Printer Manager client code bringing a little speed boost (avg 40fps -> 50fps) and better fault tolerance.
  - Refactor of SSE client into re-usable file.
  - Moved the "API Errors" button, now appears on the start of a printer row and clicking will take you straight into Printer Settings.
  - Refactor monitoring pages (panel, list, camera) with latest SSE client reusability.
  - Refine the printer map layout with borders and printer quick actions (page not public yet).
  - Reduced logging (we will bring it back later in different shape with an Exception handler)
  - Replaced fetch with axios in the local OctoFarm client calls.
  - Moved all error handling for client connections into axios calls
  - Refactored System page into separate manageable files ejs/js, cleaned up a lot of code.
  - Updated the system page layout.
  - Moved filament manager plugin actions to separate service file.
  - Printer offline logs (specifically connection refused) are now silenced after the first one.
  - Bulk commands are no longer in Printer Manager -> Moved to the action bar on views...
  - Custom gcode editor has been moved -> Files Manager and given a functionality boost.
      - You can now change the colour of the button displayed in the UI. Old buttons will default to "Green".
      - You can now filter the buttons by printers. Old buttons will default to ALL printers.
  - All octoprint plugin/client update commands have been moved under "OctoPrint Management" dropdown on Printer Manager.
  - Cleaned up OctoPrint Management icons, no longer all the plug.
  - Continual work on improving readability and contrast across the application.
  - Dashboard statistics are now produced on demand, should improve loading times a touch.
  - Printer Action buttons have been split up. I've left Web, Quick connect, ReSync and Power on the top bars for printer
    actions. Then the Printer Control from before has been split up.
      - Printer control is now Files, Control and Terminal. You will find these on most of the views in various places.
  - Client settings are no longer global. They are now attached to a user, so different users can have different
    settings/dashboard configurations.
  - File manager improvements, re-sync's are near instantaneous now.
  - Improved OctoFarms initial scan on boot and re-sync scans. Is much faster and will run multiple printers at once.
  - Removed the limits from Filament Manager that isn't using Filament Manager Plugin. You can now edit and see your
    remaining filament.
  - Improved filament manager plugin syncing. Now runs through various checks including making sure the plugin is setup
    correctly. It will fail to enable if that is so.
  - Enabling filament manager now toggles the spool check "on" by default. You can still turn off in the settings if
    required. Existing setups unaffected.
  - Filament managers spools only accept a +/- 50 on the temperature offsets. This is all OctoPrint allows.
  - Added the ability for spools to have a bed offset. Caveat with multiple spools on a printer is that it will pick the
    first spool to apply an offset.
  - Filament Manager can no longer delete spools if attached to printer.
  - Filament Manager can no longer delete profiles if attached to spool.
  - Filament Manager totals are now displayed in KG.
  - Re-enabled the filament manager spool assignment:
      - Without filament manager plugin this will be a multi-select option. You can CTRL + Click to select mutliple, or
        normal left click to select a single.
      - With filament manager plugin this will be a single dropdown menu only allowing to select a single spool as per the
        plugins requirements.
  - Printers with selected spools are now disabled from selection without filament manager plugin.
  - System information now shows OctoFarms usage as a pure value rather than just on the donut charts.
  - Cut down the history table view. Now only shows State/Printer Name/File Name/ Start/ Duration/End/ Cost/Hourly Cost.
    All other info is inspectable in the "view" button.
  - Refreshed the HistoryRoutes page Layout. Now has headers that show Monthly Totals, Statistics modal, Monthly Statistics
    Modal, Pagination, Sorting, Range and Filters.
  - Printer Manager "Re-Sync" button renamed to "Re-Connect" to differentiate it from the file manager action.
  - Improved filament usage estimates, if a jobs previous print time exists it will utilise that over the estimated value
    from OctoPrint which is often wildly inaccurate.
  - Completely reworked the history UI.
  - Client's Am I Alive server check is now through the Server Side Events, rather than constantly polling the API.
  - OctoPi-Plugin/OctoPrint-SystemInfoPlugin are now saved to the database. Printer firmware is remembered as long as the
    printer has been scanned online once!
  - If OctoFarm detects OctoPrint a multiple user setup then it will warn you rather than just producing a stale
    connection with no indication to what's happening.
  - Decoupled the API and Websocket calls. Printers will now connect in the following manor following fail hard and fast.
      - Attempt to grab the octoprint version
      - Attempt to grab both Settings and Users endpoints for initial multi-user setup and global api key checks
      - Attempts to grab all required information from OctoPrint.
      - Creates Websocket Client.
      - Attempts to grab optional information from endpoints.
  - Initial scan times changed, all data is now stored in database and will only update on a forced re-scan.
  - Due to the inclusion of User CRUD manager registration is now disabled after creation of first admin user.
  - Plugin lists/notices are now grabbed from octoprint.org not the printer. Removed one api call per printer and a lot of
    pointless duplicated data chunking.
  - Plugin enable now only shows disabled plugins available on all printers.
  - Plugin disable now only shows enabled plugins available on all printers.
  - Plugin uninstall now only shows plugins installed available on all printers.
  - OctoFarm now periodically (once per day) will run a scan to see if any updates are available for your instances
  - Converted to a basic mono-repo to aid in development. Scripts have been created for backwards compatibility with current start instructions.
  - Restart, Check for Update and Update OctoFarm buttons have been moved to the top of the "System" tab on the System page. This is to aid in security and stop users messing with system functions.
  - Changed server API logging over to morgan.
  - Moved the change background functionality out of client and into Server settings for admins only. 
  - Quick actions is now a Quick Connect, Power Toggle, Menu. Menu contains: 
    - OctoPrint Web, Resync Socket, Power settings. More coming soon!

### Removed

- Gulp packages and gulp as bundler
- Some bulk actions notification alert
- Ping/Pong message on connection log, redundant and ends up flooding the log.
- Removed Offline count from Current Operations. Feel it's pointless please open an issue if it's required back.
- state.js - WOOP HAPPY DAYS! Ripped out and gone for good!
- runners folder - Boom more feel goods!
- Reset Power Settings Option - No longer needed after settings saving refactor.

### Fixed

  - Fixed #531 - Updated settings are not grabbed when opening settings modal
  - Fixed #532 - Actual save port is not checked against live ports on OctoPrint on settings Modal
  - Fixed #567: heatmap error (race condition) in PrinterCleanerService for any newly created database
  - Fixed #576, #577: correct some function calls in PrinterCleanerService
  - Fixed #542, #381: ensureIndex mongoose warning and circular Runner import resolved
  - Fixed #598: printer settingsAppearance missing will not cause failure anymore
  - Fixed #596: changed OctoPrint plugin manager repository to new route with backwards compatibility version check
  - Fixed #608: Global update button was not appearing
  - Fixed #555: Offline after error not caught by OctoFarm. 1.6.0+
  - Fixed #609: Bulk printer functions wouldn't load due to small regression bug
  - Fixed #587: Changing printer URL doesn't rescan for changes when using settings modal
  - Fixed #592: Printer host is marked Online when URL is not correct / fake
  - Fixed #574: Reworked the statejs OctoPrint client and added tests
  - Fixed #630: System Info calls took huge amount of event-loop time (>2000ms) on Windows with a 2500ms interval period. Disabled for huge performance loss.
  - Fixed #641: Opening the console on the Printers Page with offline printers would crash the browser due to spam.
  - Fixed #638: Fixed login not working anymore after refactor
  - Fixed `snapshots` instead of `snapshot` bug on client system Javascript bundle
  - Fixed #655: Server-sent events were failing due to breaking import path of the flatted package. Fixed that path server-side.
  - Fixed #625 - Incorrect html tags on Printer Manager
  - Fixed #548 - Smaller screen action buttons wrapped incorrectly on Printer Manager
  - Fixed #665: If Global API check fails due to intial time out, never recovered and tried again increasing timeout.
  - Fixed #670: File manager initial and subsequent scans we're not recursive.
  - Fixed #669: File manager scroll wouldnt reset after switching printer.
  - Fixed #590: The Back button now disables when there's no folder to go back to.
  - Fixed #679: OctoFarm would stall on air gapped farms due to checking for OP updates.
  - Added Filament Clean back to start up so filament manager and spools list load.
  - Fixed #605: Tool total would show "null" if no spool selected.
  - Issue with totals not been counted with/without a spool selected on Printer Control.
  - Fixed #667: Weekly Utility was not loading the previous days values.
  - Fixed #698: Current Operations would try to load the old browser worker. Replaced with sse client.
  - Fixed #681: Current Operations would load on dashboard even when not enabled in settings
  - Fixed an issue with gcode scripts table
  - Fixed issue with Pre-Heat bulk command sending commands without a value inputted / value at 0.
  - Fixed bulk control function trying to display camera image when non available.
  - Fixed issue where disable, enable and uninstall plugins would show duplicate plugin list.
  - Fixed #730: Group selections we're not working as intended...
  - Fixed #672: Tool temperature offset's we're not applied before a print.
  - Fixed file manager showing folders with "_" in folder name.
  - Fixed and issue with file manager crashing if searching an empty directory.
  - Fixed "No Files Available" not been removed after uploading a file...
  - Fixed current operations on mobile views... now stacks the cards correctly.
  - Fixed an issue we're Printer Statistics wouldn't open if printer had never been live.
  - Fixed websocket issue not updating when printer url changed.
  - Fixed issue where user could enter updated URL with http:// prefix and would cause errors in backend.
  - Fixed an issue where the client would repeatedly * printer amount call for filament manager settings...
  - Fixed changelog been considered a block via parsers.
  - Fixed the buggy behaviour of the printer swap drop down in Printer Control.
  - Fixed system settings saving not correctly checking if reboot required on server and only requests client to reboot if required.
  - Fixed history chart colours for Failed and Cancelled been mixed up.
  - Fixed OctoFarm sending tool/printhead commands when cancelling a print.
  - Decoupled the historyByDay stats so they generate if you don't use spools/filament mananger at all.
  - Fixed history trying to capture timelapse, thumbnails and influxdb without been enabled...
  - Fixed history not registering spools when cancelled in some situations.
  - Fixed Latest file re-syncs we're not saved to database.
  - Fixed Put an SSE event source re-connect using debounce function. If connections lost, every browser should attempt
    to reconnect now. Chrome didn't sometimes.
  - Fixed an issue where SSE would lose the connection url if server connection lost.
  - Fixed File manager been an outright bag of crap. Files now load correctly after commands, instantly too.
  - Fixed Improved the OctoPrint file update grab so it doesn't end up making multiple calls.
  - Fixed Fix an issue with folders not reflecting their state correctly after command in file manager.
  - Fixed the utter mess of saving printer settings.

# Security
  - Protected all system CRUD endpoints by ensuring user is Administrator.
  - Protected all user CRUD endpoints by ensuring user is Administrator.
  - Protected all Alerts CRUD endpoints by ensuring user is Administrator.
  - Protected Filament Manager Plugin Enable and Filament Manager Full Resync endpoints by ensuring user is
    Administrator.
  - Protected all administrator only actions as additional protection.
  - Added basic http server protection to express with helmet. 
  - Added rate limiting to all endpoints, 100 requests in 5 seconds will trigger the global one protecting all endpoints. 
    - /printers: 100 requests in 1 minute.
  - Validated inputs on endpoints: 
    - /printers: update, add, delete, 
    - /settings: server/delete/database, server/get/database
  
## [v1.1.13-hotfix]

### Added

  - Ability to use the AUTO option for baudrate
  - Ability to click update button to go to system page

### Changed

  - Completely re-worked the auto updater mechanism
  - Completely re-worked the npm check and installation mechanism for the auto updater

### Removed

### Fixed

  - Fixed #500: Connection to printer would fail when both baudrate and port are set to "AUTO"
  - Fixed #501: Restart command fired too fast which resulted in no confirmation/error notification on client.
  - Fixed #495: Check for update would result in double notifications for airgapped farms
  - Fixed #498: Fix package version not always preset and synced correctly when not running npm commands, f.e. pm2

## [v1.1.13]

### Added

  - Added #361: OctoFarm release check and notification sets ground work for automatic updates
  - Added #373: Migrated MongoUri in config/db.js to new .env file format as MONGO=...
  - Added #374: Migrated server port to .env file as OCTOFARM_PORT=...
  - Added #351: Background image now ignored and copied from default if not present at start.
  - Added #382: Add in ability for OctoFarm to update itself with the current pm2/git implementation
    - This is actioned by two new section inside Server -> System. Two new buttons "Force Check", "Update".
  - Added #421: OctoFarm data dump. Generates a bundled zip file for download that includes all system logs and a service_information.txt file
  - Added #296: Ability to define your own page title with an Environment Variable

### Changed

  - Disabled Restart button when not using pm2 process manager
  - Node 12 now not supported. Node 14 is a minimum requirement

### Removed

  - Ability to change the port in the UI. This is now managed by environment variables. UI option will be back soon.

### Fixed

  - Fixed #240: Commands sent from the Printer Control Terminal would double wrap array.
  - Fixed #358: Spool Manager not allowing input of decimal places.
  - Fixed #398: Added back in power reset buttons.
  - Fixed #353: Filament Manager Spools list is not ignoring Spools Modal pagination.
  - Fixed #386: Server update notification would show to all users, not just Administrator group.
  - Fixed #430: Replace user and group check with middleware.
  - Fixed #396: HistoryRoutes cleaner wouldn't run after print capture.
  - Fixed #397: Thumbnails wouldn't capture on history, even with setting on.
  - Fixed #414: HistoryRoutes failing to generate due to missing default settings.
  - Fixed #438: File manager fails to load due to toFixed error.
  - Fixed #442: Re-Input catch statements for "git" commands on updater logic.
  - Fixed #444: Add in npm functions for updater command to keep packages up to date.
  - Fixed #439: Views not updating due to offline printer in first instance.
  - Fixed #414: HistoryRoutes would fail to capture due to missing settings.
  - Fixed #475: Loading system page would cause error in console due to missing settings.
  - Fixed #459: Duplicate Id's on printer manager page.
  - Fixed #472: System page would crash if release check didn't find a release.
  - Fixed #460: Update and Restart commands not correctly erroring and returning to client.
  - Fixed #468: Disable update notification and buttons to docker installs.
  - Fixed #452: Docker documnetation was missing path for /images.
  - Fixed #478: Abort with a friendly message if Node version less than 14 is detected.
  - Fixed #429 and #378: Memory/CPU graphs in system page now tolerant to missing values so it can show no matter what.

# [Released]

## [v1.1.12]

### Added

- Added a button to System page to restart OctoFarm server.

### Changed

- Added logging around system information as there was none originally, also a warning message when failing to generate.
- Pre-start script now uses 'npm ci' to make sure packages are on the latest version inside package-lock.json.
- Server restart commands will no longer silently fail... It will alert you if you haven't set up OctoFarm correctly under the pm2 named service.

### Fixed

  - #342: Quotes causing issue for Windows 10 systems in package.json start up scripts.
  - #341: System information was failing to generate on some ubuntu systems due to an outdated package. Package has been updated.
      - The new systeminformation changed some key value pairs. Please run npm
  - #337: Fixed issue with file manager not loading files due to recursion issue.

### Security

# [v1.1.11]

### Added

- #274: Added full file path to file display card.
- Gcode Scripts are now editable.
- Reset Fields Button to power settings to enable a reset of them...
- Individual Printer Statistics: New option under the Manage section for viewing statistics about your printer.
- Added check against global API Key usage. Will now throw an error warning the user it is incorrect... and to generate a User or Application Key inside OctoPrint.
- Added the ability to export any of the database collections into a .json file to bolster any issue reports.

### Changed

- Improved the power status error logs.
- #272: Improvements to the alpine image, now runs as none-root and went from around 1Gb to 268Mb in size! Big thank you to user @torresmvl for those PR's. Don't forget to email about your free t-shirt.
- Gcode scripts no longer require a description.
- Made gcode scripts wider for comments and better data input.
- Printer Manager Table has been updated to include Printer, OctoPrint designations: - Printer: Shows current printer firmware version, model and name. - OctoPrint: Shows current OctoPrint version and if on OctoPi, the version and Pi model.
- Printer Hourly Temperature Graph on Dashboard now only reacts when target is set. Will skip any room temperature readings.

### Fixed

- #223: Shutting down printers unexpectedly would keep printer in last state. - Big thanks to Chrismettal for helping me with this one.
- #226: Failing to fire commands to enclosure plugin using the Power Settings.
- Attempted fix for air gapped farms. Awaiting feedback.
- #236: File Manager would fail to return to non-recursive search on blank input.
- Fixed the slider not showing the 10/300% changes for feedrate.
- Fixed enclosure plugin commands not firing with a GET request.
- Fixed: #273 Recursive search doesn't return to root folder...
- #277: Fixed issue when person re-edited final slash back in...
- Fixed: WOL packets been undefined.
- Fixed: Update cost match in history would fail.
- #276 - Patched issue were a user couldn't send blank fields to clear Custom Power Settings.
- Fixed: Issue with autodetection of PSU control plugin causing wol settings to be destroyed.
- Fixed: Issue with Weekly Utilisation chart showing incorrect colours on a Float value.
- Fixed: #236 - Colours on Weekly Utilisation chart we're loading too dark.
- Fixed: #279 - API connection checked too early after powering up.
- Fixed: #292 - Printer Settings would fail due to missing wol settings.
- Fixed: #326 - Job doesn't reset when OctoPrint goes offline.
- Fixed: Printer Settings modal opening would throw error when OctoPrint has never been connected to farm.
- Fixed: Error grabbing octoprint plugin list/system/updates wouldn't correctly log an error.
- Fixed: Bubbling server check interval causing client to massively hang and break CPU's...
- Fixed: Issue with history card not loading spools tables
- Fixed: #297 - Issue with temperature not been applied from spool at start of a print.
- Fixed: #327 - Issue with not been able to change a spool mid print/paused when not using Filament Manager Plugin.
- Fixed: #309 - Regression with toggle button to check filament spool is loaded before print start.

### Removed

- Printer Settings drop down, was buggy and half implemented causing issues and is less used than the Printer Control one.

# [v1.1.10]

### Added

   - Last values from environmental data are displayed in the navigation bar when available. This will update every 5 seconds.
   - Gave gmccauley (and possibly others) the new Filament and HistoryRoutes graphs. Big Thanks for your data basically... I'm a dodo at times XD
   - New Client Settings - Control Panel File Top: Checking this as true will put the file section at the top of printer control. Print Status and Tools underneigth.
   - Added #252 - OctoPrint feed rate settings now allows for 10% to 300% inline with OctoPrint.
   - Added - New button in Printer manager called "Gcode Scripts". Allows for creating pre-defined gcode scripts that can be used from Printer Contol under the terminal + Bulk Gcode button. Thanks to @MTrab Discussion #250 + Issue #253
     - NOTE: Editing of the scripts is not available yet. Wanted to get this release pushed with the bug fixes. Delete and re-create for now, will sort edit for next release.

### Changed

  - Changed the ability to fire custom api power commands without command object to octoprints api.
  - Gcode scripts modal has been enlarged to accomodate possible button configurations for new feature above.
  - Printer Manager will now warn of a specific issue and tell you to log me a bug!

### Fixed

  - Fixed #234 - Adding Power commands would be overwritten on save. (also affected appearance name on OctoPrint & wakeonlan settings and grabbing default power settings from OctoPrint on a new printer.)
  - Fixed - Graph for filament daily usage would not stack values by day
  - Fixed - Auto grab of OctoPrint camera URL would incorrectly add :8080 to the url.
  - Fixed - Date range and conversion issue with filament graphs
  - Fixed #235 - Filament / HistoryRoutes graphs failing to generate data...
  - Fixed - Port preference undefined, would happen on printer management when offline printer was added.
  - Fixed - Fixed server start on some systems not correctly attaching to ipv4 interface.
  - Fixed - Issue with quick connect button sending the port as a string causing a 500 response.
  - Fixed - Spool manager not loading without spools. (only affected ancient data, pre COVID XD)
  - Fixed - Spool manager loading graphs and table without spools. (only affected ancient data, pre COVID XD)
  - Fixed error with file length/weight not getting parsed from text on Printer Control.
  - Fixed error with terminal erroring on enter command with no text.
  - Fixed #245 - File manager recursive again
  - Fixed Printer Control completely failing when 1 component didn't have data. (related to change above)

## Removed

  - Removed system settings dashboard control. Uneeded overhead.

# [v1.1.8]

### Added

   - Added improved filament manager loggin for history capture.
   - Improved the layout of the Filament Manager:
     - Spools and Profile managers are now under modals.
     - Filament Statistics UI tweaks.
     - No more content editable fields... firefox should now be able to edit values.
     - New spool overview table. Display only.
     - New Usage By Day chart - will show stacked values totaled by day of filament usage.
     - New Usage Over Time chart - will show incrementing total filemant usage by day.
     - Moved Re-Sync Filament Manager button to show with others (manage profile/spools).
   - New HistoryRoutes Chart - Will show daily totals of success / cancelled and failed prints.
   - Dashboard has the 3 new charts detailed above available.


### Changed

   - Fixed #228: Quick connect button will only activate once you have setup preferred connection preferences.
   - Printer Logs Modal for OctoPrint logs now includes line number
   - Re-organised the System dashboard settings page to include new graph options
   - HistoryRoutes statistics now only take into account successful prints.

### Fixed

   - Fixed #226: Couldn't update OctoPrint instances, restart would get in the way.
   - Fixed #223: Shutting down printers would incorrectly count towards last printer state on Dashboard Utilisation heat map.
   - Fixed issue with incorrect object on history error.
   - Fixed issue when changing spool filter not updating all dropdowns until refresh.
   - Fixed issue with File Name not been sent through Alerts.

## Removed

   - Disable Printer Assignment on Filament Manager screen, buggy... needs re-configuring.

# [v1.1.7]

### Added

  - #221: New Bulk Printer Actions on Printer Manager: (big thanks to Scott Presbrey for sponsoring this one!)
     - Pre-Heat: Select your printers and send target temps to your tool/bed/chamber.
     - Control: Select your printers and action Home/Jog commands, as well as Start, Cancel, Pause, Resume and Restart commands.
     - Gcode: Select your printers and send multiple gcode commands to multiple printers at once.

### Changed

- OctoFarm now detects any trailing forward slashes in the printer URL and removes them...
- #220: Improved the terminal function. Multi-lined commands will now be parsed and split, OctoPrint should run through these sequentially now.

### Fixed

- #197: Editing a printer after typing an incorrect connection string would cause a double listener to be created.
- Fixed issue with plugin installation crashing on successful completion when restart is required.
- #198: Fixed new system settings not generating defaults on upgrade/start up.
- #201: Fixed issue with double listener getting generated and not clearing on Re-Sync.
- #215: Fixed blank camera field not grabbing OctoPrint camera URL. (Please log an issue if this still doesn't work thanks!)
- #220: Fixed issue with terminal commands capitalising Klipper commands.

## Removed

## [v1.1.6]

### Added

  - Added new Printer Manager section called Bulk Controls. This allows for Connect/Disconnect/Delete/Power commands to be sent to your farm.
  - Q.O.L improvement with modal describing required OctoPrint steps to add a printer. Assumes you already know what your doing if you have printers in your farm...
  - API issues now show a big red badge under Printer State in Printer Management. This will only show if you Host is online to avoid in correctly alerting you if OctoPrint is shutdown. You can investigate these on the printer settings modal.
  - Current OctoPrint user is now displayed in "Printer Settings"
  - Printer Control now lists AUTO in printer Port options.
  - System -> Client Settings -> Dashboard has a new Dashboard Control, will allow for on the fly moving and resizing of your dashboard panels.
  - New Printer Manager buttons:
    - Printer Logs: Will show a full log of connections/errors/temperature relating to your OctoPrint instance.
      - OctoFarm: Shows OctoFarm connection attempts
      - OctoPrint Errors: Shows OctoPrint usb terminal errors
      - OctoPrint Logs: Shows a tabled list of OctoPrinters octoprint.logs file
      - OctoPrint Plugin Logs: Shows the output received from OctoPrints events for plugins. Only what is written to stout, call, message and sterr.
      - Printer Temperature: Historical view of printer temperature - Keeps a max of 100,000 records and then will drop the previous in the database.
  - "Save All" & "Delete All" button has been added to Printer Manager.
  - Quick connect button to Printer Action button.
  - New Printer Manager Section: Plugins!
    -   Install, Uninstall, Enable, Disable a bulk set of plugins on a bulk set of printers.
  - PSU Control settings are now grabbed from OctoPrint if they don't already exist in OctoFarm. To edit these going forware you will need to edit inside of OctoFarm as it won't pick up any changes made on OctoPrint after the initial scan.
  - OctoFarm now detects the OctoPi verion and Pi model you are using and displays this information in the "Printer Manager" section.
  - OctoFarm now checks for OctoPrint/Plugin updates on a initial scan and re-scan.
    - New UI buttons for these.
      1. Printers Manager on the list view, individual buttons for updating 1 instance.
      2. Global buttons added to the
  - HistoryRoutes will now capture an image from the mjpeg stream you input into camera url can be turned off in the new HistoryRoutes section in System.
  - HistoryRoutes now has the ability to capture a timelapse generated by OctoPrint. This currently only works with the mp4 output due to browser limitations.
    - There are 3 settings now on System -> HistoryRoutes for this. OnCompletion, OnFailure and Delete After.
  - Added initial support for OctoPrint 1.5.0 Resend statistics. Currently is captured on history and shown in the printer control view.
  - Added back in the view filters for Panel,List, Control.
  - Alerts can now send through OctoFarms HistoryRoutes ID on capture of a Failed,Error,Successful print trigger.
  - InfluxDB Export: You can find setup instructions/information in System -> Server -> InfluxDB Export.
     - exports the following information:
         - Printers Information - All farm printer information, generated every 2000ms.
         - HistoryRoutes Information - Every log to history is pushed to the database (not back dated), sent on history capture.
         - Filament Information - Same as history.
   - Changes to folder display in file manager:
     - Folders when created will stay ordered by creation date. Folders when sorted will be organised first at the top of the list, then files afterwards. There's only folder name information available to sorting for those so for now will stick to name based for all folders. This will be actioned when a page load happens, or the sorting is updated. New folders will not be sorted until that trigger. It follows the A->Z, Z->A ordering of the sorting options now too.

### Changed

  - Added additional CSS classes to buttons for theming. Applies to actions buttons only, status colours the same.
  - Removed Printer URL/Camera URL/API Key from displaying on Printer Manager and moved onto "Printer Settings" modal.
  - Allowed Printer Settings Modal to be opened whilst offline. Disables any settings relevant/requiring OctoPrint connection.
  - Export printer json now in human readable format
  - HistoryRoutes now captures printer ID. Any matches going forward will attempt the ID match and then fallback to name as before.
  - Printer scanning client display greatly improved. Now displays updated host state whilst stuff is going on in the background on the server.
  - Combined the Views settings into one tab. All views react now to the same settings for displaying Current Operations, Offline/Disconnected Printer. Note: More customise options coming in a later version.
  - Updated Printer Manager functions:
    - Delete, now brings a selection box with printer status.
    - Edit, Brings a inline edit box up. Will only update changed printers as before.
  - Split the Actions header in Printer Manager to "Manage", "Actions"
    - Actions will all be available on views and will contain "Printer Control", "OctoPrint Web", "Resync" and "Power" if setup.
    - Manage will contain "Printer Settings" and some new options detailed in #Added.
  - Made tweaks to the client side SSE implementation. Should help lockouts and button presses on less powerful client devices. (tested and seen improvements to my own small tablet)
    - UI alert when SSE fails.
    - Retry the connection if error/closed unexpectedly.
  - Changed the Power button poll rate to 5 seconds.
  - Changed server check poll rate to 2.5 seconds.
  - pm2 logs are now flushed before starting application, now only captures errors as my logs cover the rest.
  - File Manager link no longer hidden on mobile views.
  - Changed the time displays for all views, now follows unified format. Applied currently on Panel/List/Camera.
  - Camera view now hides print information (times / tools) until hovering over.
  - HistoryRoutes page now displays an image slider when loading the "edit/view" box. You can cycle through the thumbnails from your slicer if you use that plugin, or the captured image of the finished print taken from your webcam.
  - Added the option for websockets to follow 301 redirects. Should help with 301 errors.
  - Camera view now opens overlay with fullscreen.
  - Tweaks have been made to the websocket connection system. Should better recover from errors and state if user action required.

### Fixed

  - Fixed issue with File Manager not loading if printer in index 0 was offline.
  - Fixed issue with editing printers throwing error trying to update old printer status.
  - Correctly named "Remember Me" setting
  - Stopped OctoFarm creating and displaying duplicate terminal information.
  - Issue with server requiring a restart to pull in setting information.
  - Docker error when booting regarding cd directory not existing.
  - Weird issue with client server check locking up screen.
  - Fixed some audit issues, rest are development dependancies and can be ignored
  - Fixed error logs not saving correctly...
  - Printer Control now correctly allows port/baud/profile selections when printer is in "Error!" state.
  - Printer Control no longer throws an error and locks the screen if a bad connection attempt is made.
  - Fixed Panel and List views not displaying time remaining correctly.
  - Fixed issue with Printers Nuke not working.
  - Fixed multiple client connections causing doubling of data sent to client.
  - Fixed bubbling caused by user navigating away from client screen. Client now checks if screen is active, closes the server connection if not.
  - Fixed Re-Sync notification only appearing after actioned.. now persists whilst farm re-sync is going on.
  - Various client issues, full re-factor or Panel/List/Camera. Should be snappier!
  - Fixed issue with history deleting record regardless of yes/no answer.
  - Fixed issue with environmental data graph loading categories that don't exist.
  - Fixed the camera fullscreen issue not respecting rotation.
  - Fixed an issue with Error Alerts failing to trigger.

## Removed

  - Removed the annoying content editable fields on "Printer Settings" and "Printer Management" and replaced with standard input boxes.
  - Removed support for the old import scheme. Now requires to be in human readable format. Please create a new export if you used the older one previously.

## [v1.1.5.7]

### Added

  - Formalised the data json layout for Environmental Data collection same POST endpoint as before. Must send null values for anything not used:
      {
        temperature: value (°C),
        humidity: value (%),
        iaq: value (KOhms),
        pressure: value (Pa)
        date: value
      }.
  - Configurable dashboard. Allows the elements to be hidden/removed in System -> Client Settings -> Dashboard. You can also re-arrange your elements as well as re-size them to suit your needs.
  - Initial very basic support for Klipper Plugin, OctoFarm will now grab Klippers version information and display it under OctoPrints on the printer management.
  - Added server side check for CORS activation. UI on printer manager will react...
  - New Dashboard settings in System -> Client. Shows saved grid, and allows for adding/removing elements and clearing positions/sizes.
  - Added new printer manager section called "Connection Log". Just a ticker with recent API calls for now, errors will show up here and you can investigate in the printer settings.
  - New file manager sorting library. All previous defaults will no longer work, defaults to lastest files first.
  - If available last Indoor Air Quality value will be displayed.
  - Indoor Air Quality value updated to follow bosch range. 0 - 500 from Excellent air quality to Extremely Polluted.
  - Ability to upload a file to replace the background. System -> Client.
  - Remember me select box on login page, currently will remember your session for 30 days. Does not persist an OctoFarm reboot. More configuration options to be added.
  - Updated custom NPM commands for OctoFarm:
    - "npm start" - Runs OctoFarm service, will now automatically run npm install so this step is no longer required.
    - "npm stop" - Stops OctoFarm service.
    - "npm startup" - Generates system startup script so OctoFarm is persistent. You will need to copy and paste the output command into your terminal to activate this. Then use the below script to save the configuration. Same as "pm2 startup"
    - "npm saveStartup" - Saves the current configuration generated from "npm startup". Same as "pm2 save"
  - New section in "System Settings" called "Database". Currently displays the db URL and also allows some basic deleting (tactical nuke) of a database.
  - New Printer selection modal, this is currently for Multi-Upload in files manager but will eventually be used in the rest of the UI.

### Changed

  - OctoFarm now reacts to the enabled camera setting on OctoPrint. If you don't use camera's it is best to disable them here.
  - OctoFarm will now only respond to a max screen size of 2000px. Anything above this will be limited from stretching to the full horizontal width.
  - Fixed issue #102 - UI Redraw causing missed clicks.
  - Moved Logs above About on System Side bar.
  - Files no longer "a" element, can't be clicked anymore. Was confusing, suggested an action.
  - Implemented new file sorting function. Settings default to name, and will save per client in local storage.
  - File path now shows on hover if available in HistoryRoutes table.
  - Tweaks to SSE browser cache, should force re-update of data rather than blasting the client with a lot of data as it caught up... (Testing and feedback would be awesome)
  - Client side images/javascript/css is now minified and generates a source map properly for all dependancies. This should improve load times, and increase browser support going forward. These are pre-built for the client, so no action required on a users part.

### Fixed

  - Fixed file path showing on file selection instead of file name
  - Fixed Paused print not allowing cancel on Panel view.
  - Issue with session not been read when accessing site. Should save uneccassary logins. NOTE: These do not persist a OctoFarm restart.
  - Fixed issue with Printer Name filter not working with special characters on history
  - Fixed issue with file name filter not working with special characters on history
  - Fixed issue with file manager sorting not allowing update within folders.
  - Fixed issue with new files not showing above folder. Sorting/re-loading page will re-organise.
  - Fixed issue with filament manager failing system file import on server start
  - Fixed issue # 108 reliance on storage key was causing UI to lock up, and system wasn't re-scanning if didn't exist.
  - Fixed issue with file manager not removing file.

## Removed

  - Client side sorting library for printers - Not added back yet due to been a little more complex than first anticipated.
  - Client side sorting library for files.
  - Ability to set a URL as background. See Added section.

## [v1.1.5.6]

### Added

  - File Manager now displays the success/failure/last stats from OctoPrint
  - New API Endpoint for collecting enviromental data. Expected the following JSON format: {temperature: value (°C), humidity:value (%), gas_resistance: value (KOhms), date: value}. Null values are required when no data present. (MongoDB is NOT a time series database, this is capped at 90000 records... )
  - Dashboard will now show envriomental history... currently shows hard coded last 4000 records. From your data you will get a Temperature and Humidity Graph and also an IAQ Score (if you supply gas_resistance, not all sensors read this data.). If you use the BME680 find out more here: https://ae-bst.resource.bosch.com/media/_tech/media/datasheets/BST-BME680-DS001.pdf

### Changed

  - history will now update the file after it's generated. HistoryRoutes is generated 10 seconds after a print.

### Fixed

  - Printer Settings Dropdown not working.
  - Printer Control Dropdown selecting old value.
  - Fix Retract not working in Printer Control.
  - File loaded undefined and didn't really show what was going on...
  - File re-resync button actually refreshes a single file information now not the whole lot.

## [v1.1.5.6 - RC2]

### Added

  - Added version output to console log.
  - WOL Support: Wake on Lan for clients now supported. In your Printers power settings you will have a new option to enable Wake on lan. Enabling puts a new "Wake Host" Option in the normal power dropdown.
  - Message to websocket icon regarding use of global api key.
  - HistoryRoutes now shows Print Time in red formatted as {hours}:{minutes}:{seconds} underneith the original format.
  - Added a true server alive check. Client now polls this whilst active and throws a modal up when connection lost. Will reload the page automatically (manual also) when connection restored.

### Changed

  - Make a note of the plugin/settings hash
  - Adding a printer will now show Printer State as "Awaiting WebSocket" until the websocket updates the printers status.
  - File list is now stored in database to save re-scanning on server load.
  - Added timeout to file scanning, will only try to update 4 times then await users resync for information.
  - Thumbnails are now stored with history in /images/historyCollection/thumbs. The /images folder will need mounting to docker to make this persistent if you want to use this feature.

### Fixed

  - Fixed Add Printer table not clearing correctly.
  - Fixed connection to OctoPrint for release of 1.4.1. Caveat, can no longer use global API key. Fixed #85 & #89
  - Fixed issue with print time acuracy calculation in history.
  - Fixed issue with history showing incorrect cost per hour
  - Fixed camera rotation on views.
  - Fixed not grabbing name from OctoPrint.
  - Fixed filament Manager loading with 0 spools.
  - Fixed issue with changing filament dropdown on filemanager selecting printer instead.
  - Fixed duplicate listener issue when uploading new files.
  - Fixed Printer Control Dropdown not updating on modal load.
  - Fixed Printer Settings not showing Printer Selection dropdown.
  - Fixed issue of temps colours not showing on camera view.
  - Fixed stats on history not showing correctly
  - Fixed filament manager stats not fixing correctly


### Removed

## [v1.1.5.6 - RC1]

### Added

  - Power button now asks for confirmation when switching off
  - Seperate smaller width table for adding printers. Should help with adding printers on a smaller screen laptop.
  - Thumbnail to history view modal. Captures and stores it on the webserver.
  - Added percent bar for Status on HistoryRoutes Filters. Will show total failed/success/cancelled percentages on filtered results.
  - Added hover information to file actions on file list
  - New Monilithic docker builds, builds with MongoDB included.
  - Printer Control now supports multiple tools
  - Printer Control now shows "Updated" status for tools. Shows the last time the temperature was grabbed.
  - HistoryRoutes now displays multiple tool information if it was collected in the record. All successful prints will contain this information.
  - pm2 now outputs full process logs into log folder.
  - Printer Control now has web and power buttons.
  - Printers Manager now shows status for the 6 checks an OctoPrint client will go through. API, File, State, Profile, Settings and System. Red shows not yet scanned and green shows scanned.
  - Added filters to Terminal output on Printer Control. Same as OctoPrint currently: temp,sd,wait
  - Terminal output is now colour coded: temp - yellow, sd - grey, wait - red.
  - Filament manager plugin can now be resynced from the filament manager screen.
  - HistoryRoutes now calculates print cost per hour for each print.
  - HistoryRoutes statistics now show average cost per hour in the history filters sections
  - New patreon members lactose, scott and jose. Big thanks for your support!
  - Views now display "Tool #" next to filament if already displayed on the view.
  - Panel & list view now displays individual tool numbers and temps associated, bed and chamber will also be shown if enabled.
  - Camera view will tally your tool numbers temperatures, so all tool# designations are tallied to Tool and Bed and Chamber designations get tallied into Bed.
  - Added progress bar to list view extra information.
  - Current operations now displays current file

### Changed

  - Moved the file manager management buttons outside of the Printers and Files list. This keeps them at the top whilst scrolling inside your files.
  - Thumbnails if available are now captured when logging history for any file. They will be saved per file in the client images folder.
  - Panel view now shows file thumbnail if available and no camera is set.
  - Printer Control window now shows file thumbnail if available on selected job.
  - State runner now updates octoprint job information with the selected thumbnail and filament length so this information can be used on the client.
  - Started counting individual printer error/cancelled/success ratio
  - Re-configured the printer control view:
    - Moved all the elements into new positions. Hopefully this brings more focus on what's used all the time, and it also allows for upcoming modifications to see extra tools/chamber temperatures.
    - Converted Terminal input to multi-line input
  - File List now shows actions buttons as bar across bottom of file.
  - database configuration now defaults to localhost address for db uri.
  - The File list now shows Filament Cost and Printer Cost seperate.
    - Filament Cost requires a filament to be selected to generate. Re-Sync to update.
    - Printer Cost requires your printer costs been filled in in Printer Settings and also requires an expected time to be generated.
  - Client now uses service workers for information retrieval.
  - HistoryRoutes information now generated on server side then sent to the client, should improve loading times.
  - Filament information now generated on server side then sent to the client, should improve loading times.
  - Printer Control improvements, now shows loading spinner when loading/switching to a different print. Speeds should be slightly improved``
    - Printer Control now live reloads filament/file changes. Shouldn't need to re-sync nearly as much manually.
    - First re-sync will happen after 1000ms, trigger by file upload/filament change. Second re-sync on file upload first after 10000ms, this isn't always enough for OctoPrint to generate file meta so manual re-sync maybe required after this.
  - Printer Management buttons have been moved to a card body.
  - Docker no longer installs & updates node_modules on start if the folder exists.
  - Camera's on OctoFarm now respect the camera enabled setting within OctoPrint. If disabled it will attempt to display the currently selected files thumbnail, failing both the cameraurl and thumbnail url will not load the camera block.
  - Filament selection has been combined into the Tools header for list view.

### Fixed

  - Fix file manager bug with default date sorting.
  - Fixed styling issue with the filters and sorting dropdowns on views making the bar bigger.
  - Printer Settings didn't apply new content editable css to fields.
  - Fixed issue with websockets not been gracefully closed. Should help with double alerts/history notifications after editing/changing a printer meta.
  - Fixed Panel view sorting not returning to index.
  - Fixed issue with sorting breaking fullscreen elements
  - Fixed bug with filament manager not turning off editable styling
  - Fixed issue with profiles not saving on filemant manager
  - Fixed bug with file manager resetting page scroll when entering folder/choosing printer
  - Server reboot has a notification and no longer needs page to re-load. Live updating.
  - Improved loading times on history with pre-calculating the list values server side.
  - Filament manager failed on re-syncing due to changes when adding spools/profiles.
  - Speed improvements with new backend pre-calculation. All information should be prepared ready for client access before access.
  - Fixed #77 - Farm Utilisation not calculated correctly.
  - Filament Manager plugin tweaks: Fixed #73 and #74
    - Filament Manager now keeps up to date when filament is down dated. It will re-sync your filament library after a print.
    - Improved log output and it's own file.
    - Server start fires a re-sync to make sure no changes are missed.
    - Caveat: OctoFarm doesn't know when you change a filament on OctoPrint, any changes you make there for filament, you will need to tell OctoFarm with a Re-Sync/Spool selection.
  - Fixed #79 - Duplicate historical entries due to multiple listeners getting assigned on printer edit/delete.
  - Fixed some dependancy security issues and updated node modules. Please make sure to run npm install / npm update if you've already installed node_modules.

### Removed

  - HistoryRoutes may not now show your selected spool for old records with no job information caught. This is mainly going to be cancelled/failed prints as there is no information caught or prints that start and finish before OctoPrint can generate the job information. OctoFarm now relies on the tool# information provided in this for captured histories to render spool information correctly.

## [Released]

## [v1.1.5.5]

### Added

  - New sorting function for Camera, Panel and List view's. You can now filter by Idle, Active, Disconnected and Complete states and your available groups
  - You can now choose the sorting for the view too by Index, Progress and Time.
  - Added support for PrusaSlicer Thumbnail and Ultimaker Format Package Thumbnail plugins.
    - Usual OctoFarm standard applies, if you've just uploaded you need to re-sync to generate the thumbnail with the rest of the meta.

### Changed

  - Error's are now captured as a full log set. To be displayed in UI at a later date.
  - HistoryRoutes.js is non-destructive to filament

### Removed

  - Old sorting functions

### Deprecated

### Fixed

  - Fixed Printer Manager page name
  - Fixed issue with error message not displaying in hover
  - Fixed Alerts Trigger column not been wide enough to display alert.
  - Fixed Alerts section of printer settings not showing Trigger selection

## [v1.1.5.4]

### Added

  - Seperated out process/system uptimes on server settings

### Fixed

  - Fixed issue with heating trigger not working with floats
  - Fixed issue with Power settings not sending correct command

## [v1.1.5.3]

### Changed

  - Changed message for websocket returning to Alive and Receiving data

### Fixed

  - Websockets terminated correctly when changes are made to edits and farm updates.
  - Fixed filament manager setting not been respected
  - Fixed issue with multiple histories been logged due to websocket termination

## [v1.1.5.2]

### Fixed

  - Alerts manager didn't allow saving of new alerts

## [v1.1.5.1]

### Fixed

  - Fixed issue with history stalling on loading old database entries.
  - Fixed issue with editing printers not correctly clearing out the old ones.

### Security

## [v1.1.5]

- Notable changes only: to see exact changelog please look at DEVELOPMENT below.

- New Dashboard
- New Printer Management screen
- Statistics/filters added to most pages
- Improved octoprint monitor with speration between OctoPrint Host, OctoPrint Server and Websocket connection
- Filament Manager complete re-design
  - Caveat: Old filament manager database no longer works
- Overhauled history with information from filament manager and new printer settings i.e. cost.
- New Printer settings panel
- New Printer control panel
- PSUControl and other power plugin support
- New Alerts system with ability to fire custom system script.

## [DEVELOPMENTS]

## [v1.1.4.9-dev-4.4]

### Added

  - HistoryRoutes Page:
    - File Name Search
    - Path Filter
    - Spool Name Search
  - Filament Manager:
    - Pagination added to Spools and Profile lists
    - Default sort option for spools
    - Material Filter for Spools
    - Spool Search
    - Statistics bar at the top
      - Used / Remaining Progress Bar
      - Counts for profiles and spools
      - Total Weight/Used/Price
      - Material Breakdowns for Weight/Used/Price
  - File Manager:
    - Has basic statistics: File/Folder Counts, Largest Smallest and Average Size/Length
    - Displays current printer state
    - Printer list now has a filter for Active,Idle and Disconnected printers
    - Can now select filament from file manager.
      - Change filament and re-sync to update costs.
  - Alerts: This alerts are fired on a specified trigger and run a custom script with a single command passed through
    - Select Triggers: Print Done, Print Failed, Print Errors, Cool Down, Print Paused
    - Custom Script Location
    - Save new script
    - Delete old scripts
    - Edit scripts
  - Printer Settings
    - Now shows all the current alerts applied to that specific printer
  - List view Extra Info now includes percent remaining.
  - Printer errors are now logged to a seperate database.
  - New dependancy for nano events

### Changed

  - Moved filament manager plugin sync to server settings under Filament Manager Settings.
  - New Filament Setting: Check if filament selected and warn to add one before starting a print. Default: False.
  - Filament Manager allows selection when printer active IF filament Manager plugin is not linked.
  - HistoryRoutes now asks if your sure on deletions...
  - Server settings now only prompts to restart when changing setting that requires restart
  - OctoFarm now rescans the client when updating throttle settings.
  - Temps now all read from unified temperature file, should keep consistency across the board.
  - Temps are now applied independant of state. Each state has some triggers:
    - Active: Will display orange if temperature drifts out of heating variation settings
    - Complete: Will show blue when fully cooled down
    - Everything else: Will update temperature if figure available.

### Removed

### Fixed

  - Fixed broken printer settings modal
  - File Manager file action buttons on new line
  - Broken total percent in filament manager
  - Broken action buttons on views
  - Indefinate counter on ETA
  - Fixed issue with filamentCheck not getting applied with no setting.
  - Fixed firefox not added editable text boxes in
  - Fixed sticky tables on history
  - Added sticky table to printer management

## [v1.1.4.9-dev-3.9]

### Added

  - Farm Utilisation chart on dashboard now calculates Failed Hours. These are the hours totaled registered from history that are set as success = false;
  - Idle hours is now black on the farm unitlisation key, red for failed and active is green.
  - Keys and bar charts added to the Cumulative/Average times on the dashboard
  - Keys added to the Printer Status, Printer Progress, Printer Temps and Printer Utilisation heat charts on dashboard.
  - Current Operations View. Displays full screen the current operations bar.
  - Panel, List and Camera View all react to groups now. When loading a page it will always default to "All Printers", any modification with the drop down will append a URL to the page. This URL can be re-used as a book mark to automatically load a group.
  - HistoryRoutes page now has metrics.
  - Can now select and save filament changes in history.
  - Server Settings re-activated with the following:
    - Shows server Status here instead of dashboard.
    - Lists current log files and allows for download.
    - Server settings
    - Server timeout settings
  - When saving settings it now asks if you'd like to restart OctoFarm. Confirm will restart the service.
  - Client settings to show extra information on views. List, Panel and Camera View
  - File manager shows weight when length is calculated. Defaults to 1.24 density with 1.75mm filament.
  - HistoryRoutes button to set default sort function button and pagination. Remembers previously set values on client.
  - File Manager now has sort capabilities. File Name, Print Time, Upload Date.
  - New Printer settings modal. Connection Defaults, Profile Changes, Power Button actions, Gcode Script and Other Settings (Camera / Heating Triggers)
  - HistoryRoutes now has filter dropdowns for File Name, Printer Name, Filament Type.
  - Activated the restart/shutdown host and octoprint buttons
  - Added checks for power state if enabled. Will check every 20 seconds for a state change unless powered off/on/toggled through the UI.
  - Added buttons to activate the settings for power control. You will only see options for which you have setup.
    - Drop down will show "Power On/Off"
    - As above it will check every 20 seconds for a state change, unless you action power toggle/on/off.
    - Main power button will toggle the current state.
    - The Main power button will show the following colours:
      - black - No status could be found.
      - red - Printer is turned off.
      - green - Printer is turned on.
  - Filters on history table also now show totals of everything filtered, ignoring pagination.
  - Printer Cost settings calculation
    - Default values added on printer init.
    - Enter in your printers Power Consumption, kilowat price, purchase price, esitmated life span, maintenance costs
    - Will be calculated on history grab.
    - Due to cost settings been captured on history grab no backwards compatablility. Have added ability to "Update Cost" settings, if printer doesn't exist in database anymore then a default set of values will be used.
    - HistoryRoutes statistic totals now include Total Printer Cost/Highest Printer Cost
    - HistoryRoutes filter totals now show printer cost total and combined total.
  - Added drag and drop to all views and printer control panel
    - Currently when you drag a file and hover over a printer/file list you will get a darkened box, dropping your file here will initiate the upload.
    - If you only have a single file it will ask if you would like to print the file.
    - If you are on Printer Control/File Manager it will choose the current folder to upload too.


### Changed

  - Group dropdown only appears if groups exist.
  - Renamed the views removing the "Views" Tag. Added in placeholders on hover to describe function.
  - Filament manager now get's its own page (caveat, full redesign so no longer works with old database, history will show but will not recognise a filament. Editing ability to select the spool as been enabled if you'd like to update them.)
    - New support for the filament manager plugin, press the sync button at the bottom of the filament page to activate. You will require this to automagically track filament usage on your spools.
    - Will now track costs if available.
    - Can also apply temperature offsets with these, whatever is entered -/+ into the offset field will now be applied at the start of a print.
  - Reduced the width of printer manager, allowing for click close outside of the modal window.
  - HistoryRoutes page now loads latest first as default.
  - Removed underscores from history page.
  - HistoryRoutes page will only load now with history added. Message to collect some before activation pops up.
  - Job information is now captured within history for cancelled prints. May use in UI at a later date.
  - If filament exists in library then ask if you'd like to select before print.
  - HistoryRoutes now captures information and waits 10 seconds before triggering the collection. This is for filament manager sync to collect the latest values before proceding.
  - Power Settings and Alerts are now saved in database

### Removed

  - Old filament manager and database structure.
  - Removed serverConfig file, now stored in the database and edited through the UI.
  - Removed file statistic from dashboard
  - Remove old sort function from HistoryRoutes

### Fixed

  - Fixed Panel view file name been stuck in loading...
  - Printer control not correctly displaying step rate.
  - Fixed issue with list view not updating list colour on state change.
  - Fixed issue with history index sort requiring two clicks.
  - Filament calculation now correctly applies to power of.
  - Fixed annoying pop-up with no printers.
  - Fixed groups not hiding when none availabe.
  - Fixed errant blank group showing.
  - Cancelled prints not grabbing name of printer
  - HistoryRoutes collection creates unique ID based on the last captured print index, rather than the history length.
  - Fixed issue with selected filament getting overwritten when passing to history.
  - Fixed weight calculation been unusually high.
  - Fix for jobs not been captured
  - Fixed issue with filament manager not adding filaments due to 0.00 on temp offset.
  - Not collecting history if there was none.
  - Fixed issue with ping pong incorrectly fireing for mid-connection websockets
  - Fixed history index not sequencially counting if multiple entries collected at same time.
  - Fixed issue where filament would update on List/Panel view when changes/history captured.
  - Dropdowns for power appearing off page.
  - Fixed power dropdowns showing under cam headings/panel
  - Typo's in client settings
  - Timeout with large file sets

## [v1.1.4.9-dev-2.7]

### Added

  - Printer Control Manager now allows for switching of printers on the fly from the modal. No need to close and re-open.
  - Historical collection for Farm Statistics, now gathers up to 1 hours of live data. (Temperature). Resets on server restart.
  - Added loading status to all dashboard graphs and data.
  - Activity heatmap for the last 7 days - Calculates a percentage of activity per printers in that state for the whole day, calculation will happen all day then save the final days value.
  - Added check for if printers exist on dashboard load, note tells you to add some.
  - Added new Patreon member EIPS to About page.
  - Tool tip explanations for states on Printers Page. Host, Printer and Websockets.
  - New state when printer fresh on the farm, "Setting Up" Whilst awaiting for scanner to finish with other printers. Hits searching state straight after.
  - Tool tip explanations for dashboard Action buttons, and Printer Management setup buttons, camera view, panel view and list view and current operations.
  - Any table headers are now clickable and can be sorted by the text below. This includes, Printer Management, Filament List, List View, HistoryRoutes. Hovering will display a sort icon to indicate can be sorted.
  - Sort Index is now viewable on Printer List, will auto update after moving a printer into a new sort index.
  - Note to README regarding thanks to JetBrains for use of their IDE.
  - New dependancy "requests" Required for API calls to user endpoints.
  - New heat type graphs, Printer Status, Printer Progress, Printer Temps, Printer Utilisation. - Will be adding a key in next version.
  - Farm Utilisation back and updates live with active printers.
  - Current Status bar graph.
  - Current Utilisation graph.

### Changed

  - Printer web button does not disable when offline
  - Printer re-sync now detroys any established connection and re-sets up the specific printer fresh regardless of state..
  - Uploads done on the Printer Control modal are now not dependant on the status you can check the status by viewing the printer. A complete notification will be done whe the file has been uploaded.
  - Current upload count no longer uses the +/- mechanism, it counts the uploads and displays the current amount found.
  - New farm status graphs for Temp. Shows Actual and Targets for global tool and bed temperatures with a status at top for total farm temperature.
  - Dashboard printer list now moved to it's own page Printers.
  - Printer list has changed to scroll with page. The full list is loaded rather than constraining to a specific height.
  - View pages no longer inside dropdown
  - Editing printers only re-scans the currently edited set.
  - Path now shows on hover in printer manager & list view. Panel and Camera will take some time due to wrappers overlaying the tag...
  - HistoryRoutes now shows view icon instead of edit for captured prints, Notes are still editable.
  - Changed up the farm Status styling to more match inline with OctoFarm colours
  - All views inc... Printer Control now truncate names to not overflow, add "..." to the end of the string to state it has been truncated.
  - All views inc... Printer Control now display the full path when hovering over file name.
  - Re-Sync does a full sync of octoprint again.

### Removed

  - Pointless space wasting footers on dashboard
  - CPU Stats from main page.

### Fixed

  - Printer Camera in printer mananger now displays correct placeholder when no URL detected. Placeholder updated for new URL system.
  - Added in websocket Ping/Pong which will fire every 30 seconds to check the connection is still alive
  - Fixed annoying browser console output warning of multiple similar id's
  - Fixed saying "Done" when 0 seconds was detected.
  - Fixed issue with history not grabbing relevant job information due to OctoPrint sending null information when prints started without the gcode calculation running. Added checks for progress and currentZ too.
  - Fixed issue with startup trying to grab currentOp/statistics too fast causing errors.
  - Fixed logs not been deleted
  - Fixed circular structure errors with moving over to Flatted library for JSON stringify/parse.
  - Fixed overly long filenames causing wrapping issue on Camera View
  - List view not respecting word wrapping for file name
  - Fixed gap in top of list view header when scrolled
  - Fixed error with history page not displaying job information on view
  - Fixed incorrect re-direct to login/registration pages when either is disbaled. Login disabled will re-direct straight to the dashboard now.
  - Fixed issues with pages loading with no printers.

## [v1.1.4.9-dev-1]

### Added

  - New Node dependancy's, make sure to run "npm install" & "npm update"
    - pm2: Now takes over daemonising your server. Should work cross platform, and allows for server restarts to be done from the GUI.
      - Log's are still output to the log folder but you can use the following commands to control your installation:
        - pm2 stop OctoFarm: Stops the running OctoFarm service.
        - pm2 restart OctoFarm: Restarts the running OctoFarm service.
    - exec: Used for executing the pm2 scripts for restarting OctoFarm server.
  - Much improved logging for all areas. Now creates new log files as follows:
    - OctoFarm-Server.log: Server errors and information
    - OctoFarm-State.log: Printer logging for state collection...
    - OctoFarm-API.log: Logs all actions made from the client -> OctoFarm.
    - OctoFarm-HistoryCollection.log: Logs all attempts at adding prints to history.
  - Disonnected state is now counted and shown in Current Operations overview.
  - Terminal input can now be pressed with enter key
  - Terminal input now auto capitalises all inputs.
  - Printer Management now allows editing printers already on the farm. Turn on edit mode on the dashboard.
  - File manager now list upload date next to print time.
  - File manager now has an upload and print option.
  - Current Operations has a new button "Restart Print" Shows up when print is complete allowing you to quickly restart that specific print.
  - Views now have a cooldown colour change on the temperature icons. When under a specified limit the icon will go blue indicating the tool/bed is now cool.
  - All views now have 3 buttons, Printer Control, Web View (OctoPrint interface) and Power Control.

### Changed

  - Dashboard has had a re-vamp.
    - Printers are now added inline. Clicking "+ Add Printer" will pop up a box to the top of your printer list. Deleting it can be removed, and saving the printer it will be added to a new row on the list and start off a scan. A notification will be generated after a connection attempt.
  - Closed is now renamed to Disconnected. This is when your USB port is not connected to OctoPrint.
  - Server Settings only accessible by Administrator.
  - Filament moved from System Menu to the navigation bar.
  - Switched over to new platform for feature requests: https://features.octofarm.net
  - Split the Printer states for the dashboard to make it clearer. There is now the following:
    - WebSocket:
      - Green: connected.
      - Yellow: Live but not receiving data. This is usually due to your printer been disconnected from OctoPrint when added as no data is transmitted from OctoPrint.
      - Red: not connected.
    - Host State:
      - Online: Host connection active
      - Shutdown: Cannot connect to host
    - Printer State:
      - Disconnected: Printer not connected to OctoPrint.
      - No-API: Failed to grab API status, usually due to CORS if Host State = Online.
      - The usual OctoPrint states: Idle, Printing, Cancelling, Error, Paused, Pausing
  - Full file manager added to Printer Control pop-up.
  - Printer Manager now split (Old Setting Cog):
    - Printer Control (Printer Icon): Connection and Printer Control inc... file manager.
      - File selection here now has the majority of the File Manager functionality for a single printer.
    - Printer Settings (Cog Icon): Anything that's a 1 time settings, so Settings, Alerts, Power and Gcode Scripts
    - Printer Power (Power Icon): Will open the power menu for shutdown, restart, reboot and custom buttons setup in the Printer Settings Modal.
  - Split the information generation for Server -> Client comminication, will save some CPU on serverside and client side...
  - If printer name not available will default to IP.
  - Converted to using a full URL string for printer connection...
    - If you already have port:ip set in the database this will be automagically converted for you. It will default to http:// when creating the new field.
    - Anyone adding and setting up new printers will have to use the full URL string now. If you leave http:// out it will automatically add that in as default.
  - Camera URL is similar to above, it will automagically add in the http:// for you if you have previous items in the database, you may also specify your own connection string with https://.
  - Temperature values no longer use the external buttons on the input. This is now a number field and uses the original HTML up and down arrows that appear on focus.
  - Export printers now exports with the following tags: Printer Name, Printer Group, Printer URL, Camera URL and API Key
  - Import printers no longer deletes all old printers to import new ones. The new printers are added to your existing list.
  - Completed Prints are now triggered by percent complete rather than Print time left as it seems prints can get left with time left when actually completed.
  - Moved all detailed instructions to the WIKI page, and removed from README.md.
  - Views progress bars now display colours to corrospond with state. Yellow = Currently printing, Green = Complete.
  - Camera View now displays text on the print and cancel buttons.
  - File manager brought inline with the printer manager version after update.

### Removed

  - Printer Management, see changed regarding dashboard.
  - HistoryRoutes and file statistics from Dashboard.
  - Removed systemInformationService from database, extra uneeded steps as data is all gathered live anyway.

### Fixed

  - Long server starts due to second information grab. Now runs in the background to not effect start up.
  - Fixed issues with throttle and server re-start checking printers whom the hosts are not online.
  - Fixed issue with multiple connected clients causing bubbling when grabbing information from the server.
  - Fixed issue with JSON Stringify error and clients receiving duff data due to it.
  - Fixed file manager single file refresh.
  - Fixed and issue with folders not allowing entry when created inside a path.
  - Fixed issue with newly created folder not recognising new file till refresh.
  - Fixed issue with newly created files not moving to folders until refresh.
  - Fixed issue with Camera view reacting to Panel view Hide Disconnected Setting.
  - Fixed spacing icon on temperature displays
  - Fixed views not updating temperature for complete/idle printers.
  - Fixed cameras not applying multiple rotate settings

## [v1.1.4-6-bugfix]

### Added

- Added back in the re-sync all button. This will fire off the same re-sync command as the printer one but for all printers.
- Websockets connections are now indicated separately to Printer Status. The Printer Icon on the dashboard will show this status.
  - Green = Currently connected
  - Yellow = Attempting a connection
  - Red = Disconnected.
- State now grabs an Error and displays on the printer status label if one occurs until rectified.
- Show printer index on printer with no name
- Current Operations Card on view's now displays the predicted end date and time, calculated from the current date + print time remaining.
- More Checks into the API/Websocket connection... if it fails to grab your API Key it will now warn you. You will see "No-API" in the state. Pressing the refresh button for your printer on dashboard will attempt a reconnect.
- Current Operations allows you to now de-select a file and remove it from the view. When a print is complete, you will see a "Harvest Your Print!" button, click it to remove the printer from that View.
- Added configuration options to /serverConfig/timeout.js - This is for any printer that doesn't respond quick enough i.e the Prusa instances have shown to have this issue. Issue #26.

### Changed

- Dashboard layout has been updated with a fixed sidebar. Medium sized screens and above will display this.
- Refactored mobile views for dashboard - See Deprecated.
- Current Operations now viewable on mobile.
- async information reception from server -> client.
- State should now show if Serial Error occurs on OctoPrint.
- Shutdown printers, that have been scanned by the farm will now wait 15-seconds before trying to grab an API connection. This should help those with websockets not connecting initially.
- HistoryRoutes now captures and displays selected rolls of filament. No usage available from OctoPrint currently.
- An initial API connection timeout now increases until it hit's an upper limit. So all API connections will attempt at the default of 1000ms, this will then increase to 10000ms after the first attempt hitting the upper limit and hard fail afterwards. These are configurable in serverConfig/server.js.

### Deprecated

- Mobile view printer list no longer available due to dashboard changes. Will be returning in later release.

### Fixed

- Issue #21 - Camera View and Panel view don't respect Offline/Shutdown printer hiding.
- Sometimes when removing printers would incorrectly try to update the state still.
- Some offline/shutdown Printers would try ask to Re-Sync when not required due to still been offline/shutdown.
- My git account... pushes as myself now. Hopefully...
- Camera View Current Operations now updates with printers.
- Fixed issue with Current Operations not clearing final finished or ended print card.
- Issue #22 - File Manager crashes when using Canvas Hub.
- Docker should now correctly put logs into log folder.
- Freshly created filament is now found and saved in the history logs.
- Issue #26 - File timeout issues.
  - This issue is down to a ludicrously large amount of gcode files stored on a persons OctoPrint system. If your a gcode hoarder and having issues with your files scanning into OctoFarm you will need to play with the API connections, or do some house keeping. Anyone else you won't know any different.
  - Some numbers reported back from a user:
    - sub 200 files, was completely fine.
    - 380 + files will nearly hit the full second api timeout which is 10 seconds...
    - 670 + files you will need to play with the system timeout I've created to get those to scan.
  - I will be working to make improvements to this in the future where possible but for now the timeout changes will succeed and I believe it's only an edge set of users that get this effect going by reports I've had. If you do not, do not worry.

## [v1.1.4-2-bugfix]

### Added

- New states to OctoPrint detection... Now includes and reacts to "Searching..." + "Shutdown".
  - Searching... will be shown when OctoFarm is trying to make a connection to to OctoPrint...
  - If the OctoPrint host is unreachable it will enter an Shutdown state... NOTE: If OctoPrint instance is added in a shutdown state, it currently get's stuck in Searching... a Re-Sync will refresh this.

### Changed

- All screens updated to respond to the changes.

### Fixed

- Fixed issue with passworded/non-passworded OctoPrint instances running on 1.4.0 not re-establishing web sockets.
- Fixed issue with adding printers offline, not correctly re-establishing websocket connection.
- Fixed issue with Shutdown Instances, ie. the OctoPrint host been turned off, causing server crash.
- Current Operations correctly loads if all printers are added offline, no display error requiring refresh.

## [Released]

## [v1.1.4-bugfix]

### Added

- Added windows specific docker-compose example to README

### Changed

- Offline Polling is now back. System -> Server Settings to change and click save to update.
- Updated the note on the settings screen to better reflect this and it's affect. Yes I like potato's.
- Changed the whole websocket implementation to help with issue #15. NOTE: If you add your printer to the farm offline, you may still need to re-sync (dashboard re-sync button) it to get it detected by the farm. I'm working on why this is happening still. Printers added Online then going Offline do not encounter this. This is also the case for restarting the server with offline printers.

### Removed

### Deprecated

### Fixed

- Fixed the errant " displayed on all views
- Fixed the errant . when loading offline printers.
- Fixed issue with printer's not collecting correct data issue #15 ie \_default bug... Should no longer exist.
- Fixed issue with retract button not working issue #18

### Security

## [Released]

## [v1.1.4]

### Added

- Massive readme update, installation instructions will hopefully be a bit more clear now. Especially for docker!
- Closed printers are tracked better.
- Ability to change port - Setting available in serverConfig/server.js requires server restart to take effect.
- Ability to turn off login requirement - Setting available in serverConfig/server.js requires server restart to take effect.
- Ability to turn off registration pages - Setting available in serverConfig/server.js requires server restart to take effect.
  - For docker check the README.md it contains the paths you need to make persistent.
- Notes to printer manager regarding HTTP and the use of port:ip combo.
- Padded our the installation instructions on the README.md file.
- Dashboard now has the ability to refresh the printers connection/information. Good incase you encounter crashes and the websocket doesn't automatically update, or you make changes to OctoPrints settings outside of OctoFarm.
  - Pressing on an Offline printer will attempt to re-establish the lost websocket connection then update the instace from OctoPrint.
  - Pressing on an Online printer will update the instance from OctoPrint.
- New button on Printer List in Dashboard. You can drag and drop this button to re-order your printer list. This will also persist a reboot, all views respect this order.
- HistoryRoutes list delete button is now enabled.
- HistoryRoutes list edit button is now enabled.

### Changed

- Docker now checks for updated packages on start.
- Client will automatically reload the page in 10 seconds if connection to server is lost.
- Tables should now be somewhat responsive on smaller screens. This isn't perfect, tables aren't great for smaller screen sizes but hope this mitigates it some. Anyone with access to smaller devices (mobiles and tablets) send me your screenshots and I will try and improve further.
- Printer Database now stores: FeedRate, FlowRate, PrinterName, Custom Sort Index and filament selected.
- All monitoring views added truncate for filename. Overflows will be replaced with "..."
- Farm Utilisation Idle hours is now correctly multiplied by the total printers in the farm.
- Farm Statistics updated on a longer interval
- Updated port example to show 80 instead of 5001 which is the more common application due to most people using the Pi installation of OctoPrint.
- Printer Manager is restricted to the Admin user only. (This is the first user created).
- Get a warning when adding printers to remove http:// from IP and Camera URL.
- Printers displayed on page will respect the sortedIndex.
- added AutoComplete tags to password and username forms.
- Panel view will now display printers without a CameraURL attached.
- Camera Columns setting is now activated. You can choose from 1-6 columns per row, including 5!.

### Removed

### Deprecated

### Fixed

- Blue screen (selecting) when double clicking a camera view to enlarge.
- Fixed file manager not loading when no Active/Idle/Closed printers are present. Now requires at least 1 Active/Idle/Closed printer to open.
- Fixed Panel View action buttons not working.
- OctoFarm.net Mobile Menu fix
- Percent values correctly rounded to 1 decimal place on dashboard.
- A blank field in the cameraURL now actually pulls through your camera settings from OctoPrint.
- Cameral URL now saves to database after been updated in UI.
- Dashboard now shows printer name if available when offline.
- Statistic runners now close with printer update.
- Fixed annoying message in logs when a client connects
- Times no longer chop off multiple's of 10
- Fixed issue where filament was sometimes not collected in HistoryRoutes.
- Fixed issue where flowRate was getting confused with feedRate. Both values are correctly applied now.
- Never online printers now correctly re-grab printer information when connection is re-established.
- Deleting a printer should not require server restart anymore. Please inform me if this is not the case, my testings suggests it's fine now.
- Fixed circular reference error with filaments
- Fixed Panel view not updating filament selection if not previously selected.
- Fixed Colour heading on Filament Type Selection.
- Fixed issue with Printer Manager locking when pressing a few action buttons.
- Printer Manager shows no camera message when none inputted.
- I've found an issue with the \_default profile on File Manager, I think there's some setup specific settings that I can't replicate. I've mitigated this with some checks, but please if your File Manager shows the warning please update issue [#15](https://github.com/NotExpectedYet/OctoFarm/issues/15) with a screen shot of your profile page so I can replicate it further here on my test boxes.
- Fixed the ability to change your background to a URL.

### Security

- Updated some packages with security vulnerabilities. Please make sure to do npm update before starting the application to update these.

## [1.1.3 - BETA :: includes 1.1.1 + 1.1.2] - 13/03/2020

### Added

- Updated to async JSON.stringify implentation to alleviate any further stringify issues.
- 2 Docker installation options:
  https://hub.docker.com/r/thetinkerdad/octofarm - Big thanks to youtuber TheTinkerDad for creating and managing this one.
  https://hub.docker.com/repository/docker/octofarm/octofarm - Thanks to user Knoker for the help and PR with this.

### Changed

- Nothing

### Removed

- Nothing

### Deprecated

- Nothing

### Fixed

- Issue #1 - Panel View wasn't respecting the Hide Closed client setting
- Issue regarding octoprint (I believe, need to test further and reproduce) missing sending temperature data for history
- Cured the memory issue by sending malformed and large objects through JSON.parse

### Securit

- Nothing

## [1.1.0 - BETA] - 12/03/2020

### Added

- Converted to server, database and client package
- Uses websocket for real time information from your octoprint instances
- Uses Server Side Events to keep the OctoFarm web client up to date with what your Server is tracking.
- HistoryRoutes section which will
- Filament Manager to track what's on your printer and what you used on a print stored in history
- Brand new file manager with multi upload and queue features.
- Current Operations window configurable to be viewable on any of the monitoring screens as well as it's home on the dashboard.
- Login system, first user created become Admin. (for a future release).
- System information to see the current load of the server OctoFarm runs on.
- Farm Information which will show some grouped farm information about your current jobs.
- Famm Statistics which will give you a quick overview on your farm.
- Print Statistitcs which will collate the history page into some fancy metrics.
- Added Terminal output to interface.

### Changed

- Updated with a brand new Dashboard to include some of the above.
- Revamped monitoring views, all have been neatened.
- Revamped Printer manager accessible from all views: - remembering your printer connection settings - Merged control/tune/file manager tab. - As above, this is where the terminal lives.

### Removed

  - All of version 1.0... this is brand new!

### Deprecated

- Wallpaper can no longer be changed (to be fixed in future release)
- Camera view is currently locked... (to be fixed in a future release)

Nothing else from 1.0 I believe

### Fixed

- Camera rotation not sticking with double click enlarge.
