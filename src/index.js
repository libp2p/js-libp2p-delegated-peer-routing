'use strict'

const PeerInfo = require('peer-info')
const dht = require('ipfs-api/src/dht')
const defaultConfig = require('ipfs-api/src/utils/default-config')

const DEFAULT_IPFS_API = {
  protocol: 'https',
  port: 443,
  host: 'ipfs.io'
}

class DelegatedPeerRouting {
  constructor (api) {
    this.api = Object.assign({}, defaultConfig(), api || DEFAULT_IPFS_API)
    this.dht = dht(this.api)
  }

  findPeer (id, callback) {
    this.dht.findpeer(id, (err, results) => {
      if (err) {
        return callback(err)
      }

      // cleanup result from ipfs-api
      const actual = results.filter((res) => Boolean(res.Responses))

      if (actual.length === 0) {
        return callback(new Error('peer not found'))
      }

      const details = actual[0].Responses[0]
      const info = new PeerInfo(details.ID)
      details.Addrs.forEach((addr) => info.multiaddrs.add(addr))

      // there should be only one of these
      callback(null, info)
    })
  }
}

module.exports = DelegatedPeerRouting
