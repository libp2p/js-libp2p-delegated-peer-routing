'use strict'

const PeerId = require('peer-id')
const dht = require('ipfs-http-client/src/dht')
const defaultConfig = require('ipfs-http-client/src/utils/default-config')

const DEFAULT_MAX_TIMEOUT = 30e3 // 30 second default
const DEFAULT_IPFS_API = {
  protocol: 'https',
  port: 443,
  host: 'ipfs.io'
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
   * @param {object} options
   * @param {number} options.maxTimeout How long the query can take. Defaults to 30 seconds
   * @returns {Promise<PeerInfo>}
   */
  async findPeer (id, options = {}) {
    if (PeerId.isPeerId(id)) {
      id = id.toB58String()
    }

    options.maxTimeout = options.maxTimeout || DEFAULT_MAX_TIMEOUT

    try {
      return await this.dht.findPeer(id, {
        timeout: `${options.maxTimeout}ms`// The api requires specification of the time unit (s/ms)
      })
    } catch (err) {
      if (err.message.includes('not found')) {
        return undefined
      }

      throw err
    }
  }
}

module.exports = DelegatedPeerRouting
