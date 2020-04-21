# js-libp2p-delegated-peer-routing

Leverage other peers in the network to perform Peer Routing calls.

Requires access to `/api/v0/dht/findpeer` HTTP API endpoint of the delegate node.

## Lead Maintainer

[Jacob Heun](https://github.com/jacobheun)

## Example

```js
const DelegatedPeerRouting = require('libp2p-delegated-peer-routing')

// default is to use ipfs.io
const routing = new DelegatedPeerRouing()

try {
  const { id, multiaddrs } = await routing.findPeer('peerid')

  console.log('found peer details', id, multiaddrs)
} catch (err) {
  console.error(err)
}
```

## License

MIT
