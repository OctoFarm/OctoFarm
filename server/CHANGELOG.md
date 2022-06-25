# :octopus: :octopus: OctoFarm's Server Changelog :octopus: :octopus:

## [1.5.0](https://github.com/OctoFarm/OctoFarm/compare/client-1.5.0...1.5.0) (2022-06-25)

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