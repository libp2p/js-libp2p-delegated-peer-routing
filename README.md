# js-libp2p-delegated-peer-routing

Leverage other peers in the network to perform Peer Routing calls.

Requires access to `/api/v0/dht/findpeer` HTTP API endpoint of the delegate node.

## Lead Maintainer

[Jacob Heun](https://github.com/jacobheun)

## Requirements

`libp2p-delegated-peer-routing` leverages the `ipfs-http-client` library and requires an instance of it as a constructor argument.

```sh
npm install ipfs-http-client libp2p-delegated-peer-routing
```

## Example

```js
const DelegatedPeerRouting = require('libp2p-delegated-peer-routing')
const ipfsHttpClient = require('ipfs-http-client')

// default is to use ipfs.io
const routing = new DelegatedPeerRouing(ipfsHttpClient({
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
```

## License

MIT
