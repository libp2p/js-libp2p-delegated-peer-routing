# @libp2p/delegated-peer-routing <!-- omit in toc -->

[![libp2p.io](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![Discuss](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg?style=flat-square)](https://discuss.libp2p.io)
[![codecov](https://img.shields.io/codecov/c/github/libp2p/js-libp2p-delegated-peer-routing.svg?style=flat-square)](https://codecov.io/gh/libp2p/js-libp2p-delegated-peer-routing)
[![CI](https://img.shields.io/github/actions/workflow/status/libp2p/js-libp2p-delegated-peer-routing/js-test-and-release.yml?branch=master\&style=flat-square)](https://github.com/libp2p/js-libp2p-delegated-peer-routing/actions/workflows/js-test-and-release.yml?query=branch%3Amaster)

> Leverage other peers in the libp2p network to perform Peer Routing calls.

## Table of contents <!-- omit in toc -->

- [Install](#install)
  - [Browser `<script>` tag](#browser-script-tag)
- [Requirements](#requirements)
- [Example](#example)
- [API Docs](#api-docs)
- [License](#license)
- [Contribution](#contribution)

## Install

```console
$ npm i @libp2p/delegated-peer-routing
```

### Browser `<script>` tag

Loading this module through a script tag will make it's exports available as `Libp2pDelegatedPeerRouting` in the global namespace.

```html
<script src="https://unpkg.com/@libp2p/delegated-peer-routing/dist/index.min.js"></script>
```

Leverage other peers in the network to perform Peer Routing calls.

Requires access to `/api/v0/dht/findpeer` and `/api/v0/dht/query` HTTP API endpoints of the delegate node.

## Requirements

`libp2p-delegated-peer-routing` leverages the `kubo-rpc-client` library and requires an instance of it as a constructor argument.

```sh
npm install kubo-rpc-client libp2p-delegated-peer-routing
```

## Example

```js
import { createLibp2p } from 'libp2p'
import { delegatedPeerRouting } from '@libp2p/delegated-peer-routing'
import { create as kuboClient } from 'kubo-rpc-client'

// default is to use ipfs.io
const client = kuboClient({
  // use default api settings
  protocol: 'https',
  port: 443,
  host: 'node0.delegate.ipfs.io'
})

const node = await createLibp2p({
  peerRouters: [
    delegatedPeerRouting(client)
  ]
  //.. other config
})
await node.start()

const peerInfo = await node.peerRouting.findPeer('peerid')
console.log('peerInfo', peerInfo)
```

## API Docs

- <https://libp2p.github.io/js-libp2p-delegated-peer-routing>

## License

Licensed under either of

- Apache 2.0, ([LICENSE-APACHE](LICENSE-APACHE) / <http://www.apache.org/licenses/LICENSE-2.0>)
- MIT ([LICENSE-MIT](LICENSE-MIT) / <http://opensource.org/licenses/MIT>)

## Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
