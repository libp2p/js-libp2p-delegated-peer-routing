'use strict'

const PeerInfo = require('peer-info')
const PeerId = require('peer-id')
const dht = require('ipfs-api/src/dht')
const defaultConfig = require('ipfs-api/src/utils/default-config')

const DEFAULT_IPFS_API = {
  protocol: 'https',
  port: 443,
  host: 'ipfs.io'
}

const peerNotFoundError = (id) => {
  return new Error(`Peer "${id}" not found`)
}

class DelegatedPeerRouting {
  constructor (api) {
    this.api = Object.assign({}, defaultConfig(), DEFAULT_IPFS_API, api)
    this.dht = dht(this.api)
  }

  /**
   * Attempts to find the given peer
   *
   * @param {PeerID} id
   * @param {function(Error, PeerInfo)} callback
   * @returns {void}
   */
  findPeer (id, callback) {
    if (typeof id !== 'string') {
      id = id.toB58String()
    }

    this.dht.findpeer(id, (err, results) => {
      if (err) {
        return callback(err)
      }

      // cleanup result from ipfs-api
      const actual = results.filter((res) => Boolean(res.Responses))

      if (actual.length === 0) {
        return callback(peerNotFoundError(id))
      }

      const wantedResponse = actual.find((el) => el.Type === 2)
      if (wantedResponse === undefined) {
        return callback(peerNotFoundError(id))
      }
      const details = wantedResponse.Responses[0]
      const info = new PeerInfo(
        PeerId.createFromB58String(details.ID)
      )
      details.Addrs.forEach((addr) => info.multiaddrs.add(addr))

      // there should be only one of these
      callback(null, info)
    })
  }
}

module.exports = DelegatedPeerRouting
