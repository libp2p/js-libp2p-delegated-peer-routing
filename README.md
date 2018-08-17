# js-libp2p-delegated-peer-routing
Leverage other peers in the network to perform Peer Routing calls.

## Lead Maintainer

[Jacob Heun](https://github.com/jacobheun)

## Example

```js
const DelegatedPeerRouting = require('libp2p-delegated-routing')

// default is to use ipfs.io
const routing = new DelegatedPeerRouing()

routing.findPeer('peerid', (err, peerInfo) => {
  if (err) {
    return console.error(err)
  }

  console.log('found peer details', peerInfo)
})
```

## License

MIT
