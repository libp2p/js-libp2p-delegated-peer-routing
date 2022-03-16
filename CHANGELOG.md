### [1.0.1](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v1.0.0...v1.0.1) (2022-03-16)


### Bug Fixes

* update interfaces ([#59](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/59)) ([67e8ae3](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/67e8ae3c1adae5b4833b514f38e16f54439dab75))

## [1.0.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.11.1...v1.0.0) (2022-03-04)


### ⚠ BREAKING CHANGES

* switch to named exports, ESM only

### Features

* convert to typescript ([#58](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/58)) ([3013bf8](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/3013bf8c733f23ce08c98c4faad94d8b8bcd63cd))

## [0.11.1](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.11.0...v0.11.1) (2021-12-07)


### Bug Fixes

* yield closer peers as they arrive ([#51](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/51)) ([1892785](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/1892785d70a5d709aac66f2494f79e7768a2b7c4))



# [0.11.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.10.0...v0.11.0) (2021-12-02)


### chore

* update peer-id dep ([#47](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/47)) ([1664f69](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/1664f69b7234e8bc41dc6641ebd70fb8fa1b0129))


### BREAKING CHANGES

* requires node 15



# [0.10.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.9.0...v0.10.0) (2021-07-07)


### chore

* update to new multiformats ([#46](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/46)) ([44cd293](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/44cd2933b705285cc5081e7469ddc3c137a539dc))


### BREAKING CHANGES

* uses the CID class from the new multiformats module



# [0.9.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.8.1...v0.9.0) (2021-04-09)



## [0.8.2](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.8.1...v0.8.2) (2020-11-30)



## [0.8.1](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.4.0...v0.8.1) (2020-11-27)


### Bug Fixes

* accept http client instance ([#39](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/39)) ([bd9ecc3](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/bd9ecc311e87604d489cae5e832691bd1dec7429))


### chore

* make ipfs-http-client a peer dependency ([#32](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/32)) ([a1b1b5e](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/a1b1b5ec59af97f5ab708c757808940dbcb070d9))
* remove-peer-info-from-api ([#25](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/25)) ([f49ddc0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/f49ddc0740963587fc0976c2a627f241bd045abf))


### Features

* add support for api dht/query endpoint ([#37](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/37)) ([6fa569c](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/6fa569cdaaeca3ca200af8b3c10b2a098faff5c1))


### BREAKING CHANGES

* The ipfs-http-client must now be installed
as a peer dependency. It is no longer included as a dependency
of this module.

The reason the http-client should be a peerDependency and
not a dependency is that its API requires knowledge of the
http-client (we pass in the api endpoint details).
* findPeer returns id and addrs properties instead of peer-info instance

* chore: address review



# [0.8.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.7.0...v0.8.0) (2020-10-21)



<a name="0.7.0"></a>
# [0.7.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.6.1...v0.7.0) (2020-08-26)


### Bug Fixes

* accept http client instance ([#39](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/39)) ([bd9ecc3](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/bd9ecc3))



<a name="0.6.1"></a>
## [0.6.1](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.6.0...v0.6.1) (2020-08-14)


### Features

* add support for api dht/query endpoint ([#37](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/37)) ([6fa569c](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/6fa569c))



<a name="0.6.0"></a>
# [0.6.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.5.0...v0.6.0) (2020-08-12)



<a name="0.5.0"></a>
# [0.5.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.4.3...v0.5.0) (2020-04-23)


### Chores

* make ipfs-http-client a peer dependency ([#32](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/32)) ([a1b1b5e](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/a1b1b5e))
* remove-peer-info-from-api ([#25](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/25)) ([f49ddc0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/f49ddc0))


### BREAKING CHANGES

* The ipfs-http-client must now be installed
as a peer dependency. It is no longer included as a dependency
of this module.

The reason the http-client should be a peerDependency and
not a dependency is that its API requires knowledge of the
http-client (we pass in the api endpoint details).
* findPeer returns id and addrs properties instead of peer-info instance

* chore: address review



<a name="0.4.3"></a>
## [0.4.3](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.4.2...v0.4.3) (2020-04-16)



<a name="0.4.2"></a>
## [0.4.2](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.4.1...v0.4.2) (2020-04-09)



<a name="0.4.1"></a>
## [0.4.1](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.4.0...v0.4.1) (2020-02-04)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.3.1...v0.4.0) (2019-11-29)


### Chores

* rename timeout option ([#14](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/14)) ([36d852f](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/36d852f))


### BREAKING CHANGES

* maxTimeout option renamed to timeout



<a name="0.3.1"></a>
## [0.3.1](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.3.0...v0.3.1) (2019-07-24)


### Bug Fixes

* limit concurrent HTTP requests ([#12](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/12)) ([e844d30](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/e844d30))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.2.3...v0.3.0) (2019-07-12)


### Features

* refactor to use async/await ([#8](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/8)) ([1827328](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/1827328))


### BREAKING CHANGES

* API refactored to use async/await

Also upgrades all the deps, moves from `ipfs-api` to `ipfs-http-client`
and removes a lot of results massaging that is now done in the
http client.



<a name="0.2.3"></a>
## [0.2.3](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.2.2...v0.2.3) (2019-07-10)



<a name="0.2.2"></a>
## [0.2.2](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.2.1...v0.2.2) (2018-09-27)


### Features

* add timeout defaults ([#6](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/6)) ([2909585](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/2909585))



<a name="0.2.1"></a>
## [0.2.1](https://github.com/libp2p/js-libp2p-delegated-peer-routing/compare/v0.2.0...v0.2.1) (2018-08-30)


### Bug Fixes

* better support for peer ids ([#5](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/5)) ([60655a9](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/60655a9))



<a name="0.2.0"></a>
# 0.2.0 (2018-08-23)


### Bug Fixes

* Syntax highlighting on README ([67fb497](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/67fb497))


### Features

* initial implementation ([#1](https://github.com/libp2p/js-libp2p-delegated-peer-routing/issues/1)) ([7fd93ae](https://github.com/libp2p/js-libp2p-delegated-peer-routing/commit/7fd93ae))
