# js-libp2p-delegated-peer-routing
Leverage other peers in the network to perform Peer Routing calls.

## Lead Maintainer

[Jacob Heun](https://github.com/jacobheun)

## Example

```js
const DelegatedPeerRouting = require('libp2p-delegated-peer-routing')

// default is to use ipfs.io
const routing = new DelegatedPeerRouing()

try {
  const peerInfo = await routing.findPeer('peerid')

  console.log('found peer details', peerInfo)
} catch (err) {
  console.error(err)
}
```

## License

MIT
