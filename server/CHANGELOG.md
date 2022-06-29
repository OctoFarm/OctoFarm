# :octopus: :octopus: OctoFarm's Server Changelog :octopus: :octopus:

### [1.5.1](https://github.com/OctoFarm/OctoFarm/compare/client-1.5.1...1.5.1) (2022-06-29)

:hammer: Bug Fixes :hammer:
* **server:** memory rounding issue causing incorrect percentage to display (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/df6d624637c3c0420dcfbbb747768c799404ea06)
* **server:** Not using correct information for generating file information states, closes #1145 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/136ac0a732b05cacbbb89c8c14f98324d34fe5d6)
* **server:** Editing printers showed backend url not user inputted, closes #1142 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/a1b031be156a5e53d56f977ca619d2d5358188a7)
* **server:** Not correctly dealing with database and captured printer profile information, closes #1102 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/cb1439538eee092dd7dd475f918ee54451f441c9)
* **server:** server connection failing when user not an "octofarm" derivative, closes #1141 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/3d42f495ab6c2f63148e5a3ee692cfe23b4856df)

:dash: Code Improvements :dash:
* **server:** make sure to break out of user loop if no octofarm derivative user found (https://github.com/OctoFarm/OctoFarm/pull/1149#:~:text=make%20sure%20to,%E2%80%A6designation%20found)
  …designation found
* **server:** Make camera proxy enabling restart required, closes #1148 (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/c51ea07add6c60f987e215a286fe93c907fe431c)
* **server:** better re-organise system tasks so they're safer and more consistently run (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/41a2ebd0d728ca598bfaa7584a78c3f7d3cb1beb)
* **server:** improve server boot task completion time (https://github.com/OctoFarm/OctoFarm/pull/1149/commits/f003f50964e96b262a6537f9cdafd270c956418c)

## [1.5.0](https://github.com/OctoFarm/OctoFarm/compare/client-1.5.0...1.5.0) (2022-06-25)

### :dash: Code Improvements :dash:

* **server:** [send current octoprint user to printer manager](https://github.com/OctoFarm/OctoFarm/pull/1132/commits/13d62ab38f93ce832b9fe8800b35f8d1ab586b4a)

### :stars: New Features :stars:
* **server:** [proxy mjpeg stream to client](https://github.com/OctoFarm/OctoFarm/pull/1132/commits/2d107eb85f688a026131c478be2f97236405aadf)

### :hammer: Bug Fixes :hammer:
* **server:** [not saving Estimated Life Span settings for printer cost settings](https://github.com/OctoFarm/OctoFarm/pull/1132/commits/7c65250f4d75dd3ca9ae218f92c5c18ee0d0d2aa)

### [1.4.3](https://github.com/OctoFarm/OctoFarm/compare/1.4.2...1.4.3) (2022-06-24)

### :hammer: Bug Fixes :hammer:

* **server:** fix octoprint proxy 404 ([4753109](https://github.com/OctoFarm/OctoFarm/commit/4753109ea4bca981cc955a129a700071b8327761))

### [1.4.2](https://github.com/OctoFarm/OctoFarm/compare/client-1.4.1...1.4.2) (2022-06-24)

### :x: Removed :x:

* **server:** mjpeg proxy whilst i can figure out 4 stream limit](https://github.com/OctoFarm/OctoFarm/pull/1128/commits/0470db95ef9c322f0a23769b23ac497b1268b66c)

### [1.4.1](https://github.com/OctoFarm/OctoFarm/compare/client-1.4.0...1.4.1) (2022-06-23)

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

* **server:** proxy cameras through octofarm server ([cec5c85](https://github.com/OctoFarm/OctoFarm/commit/cec5c85a78a7ba35c4f7c84d10488b2dcd7fce06))
* **server:** redirect all file uploads through the octofarm proxy ([b5dfeb2](https://github.com/OctoFarm/OctoFarm/commit/b5dfeb2d106f4dc8f8b1f91f51a4e36c106bea4c))


### :hammer: Bug Fixes :hammer:

* **server:** allow inputting blank group name in printer edit closes [#1096](https://github.com/OctoFarm/OctoFarm/issues/1096) ([439cf67](https://github.com/OctoFarm/OctoFarm/commit/439cf67d7aaa6aef466b031bff768e3b54a645b6))
* **server:** fix initial grab of supported plugin data and octoprint name ([ff67914](https://github.com/OctoFarm/OctoFarm/commit/ff6791491d00353cbef604c799f10f25290c6efb))
* **server:** grab installed client version from package-lock fixed [#1107](https://github.com/OctoFarm/OctoFarm/issues/1107) ([873dd9c](https://github.com/OctoFarm/OctoFarm/commit/873dd9c2f4aab26e8e4262aff9e075bd0e304f55))
