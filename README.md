# js-libp2p-delegated-peer-routing

Leverage other peers in the network to perform Peer Routing calls.

Requires access to `/api/v0/dht/findpeer` and `/api/v0/dht/query` HTTP API endpoints of the delegate node.

## Lead Maintainer

[Jacob Heun](https://github.com/jacobheun)

## Requirements

`libp2p-delegated-peer-routing` leverages the `ipfs-http-client` library and requires an instance of it as a constructor argument.

```sh
npm install ipfs-http-client libp2p-delegated-peer-routing
```

## Example

```js
const PeerId = require('peer-id')
const DelegatedPeerRouting = require('libp2p-delegated-peer-routing')
const ipfsHttpClient = require('ipfs-http-client')

// default is to use ipfs.io
const routing = new DelegatedPeerRouting(ipfsHttpClient.create({
  // use default api settings
  protocol: 'https',
  port: 443,
  host: 'node0.delegate.ipfs.io'
}))

try {
  const { id, multiaddrs } = await routing.findPeer('peerid')

  console.log('found peer details', id, multiaddrs)
} catch (err) {
  console.error(err)
}

const peerId = await PeerId.create({ keyType: 'ed25519' })
for await (const { id, multiaddrs } of routing.getClosestPeers(peerId.id)) {
  console.log('found closest peer', id, multiaddrs)
}

```

## License

MIT
