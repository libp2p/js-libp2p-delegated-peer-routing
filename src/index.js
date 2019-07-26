'use strict'

const PeerId = require('peer-id')
const dht = require('ipfs-http-client/src/dht')
const defaultConfig = require('ipfs-http-client/src/utils/default-config')
const { default: PQueue } = require('p-queue')

const DEFAULT_MAX_TIMEOUT = 30e3 // 30 second default
const DEFAULT_IPFS_API = {
  protocol: 'https',
  port: 443,
  host: 'node0.delegate.ipfs.io'
}

class DelegatedPeerRouting {
  constructor (api) {
    this.api = Object.assign({}, defaultConfig(), DEFAULT_IPFS_API, api)
    this.dht = dht(this.api)
    // limit concurrency to avoid request flood in web browser
    // (backport of: https://github.com/libp2p/js-libp2p-delegated-peer-routing/pull/12)
    this._httpQueue = new PQueue({ concurrency: 4 })
  }

  /**
   * Attempts to find the given peer
   *
   * @param {PeerID} id
   * @param {object} options
   * @param {number} options.maxTimeout How long the query can take. Defaults to 30 seconds
   * @param {function(Error, PeerInfo)} callback
   * @returns {void}
   */
  findPeer (id, options, callback) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    } else if (typeof options === 'number') { // This will be deprecated in a next release
      options = {
        maxTimeout: options
      }
    } else {
      options = options || {}
    }

    if (PeerId.isPeerId(id)) {
      id = id.toB58String()
    }

    options.maxTimeout = options.maxTimeout || DEFAULT_MAX_TIMEOUT

    this._httpQueue.add(() => this.dht.findPeer(id, {
      timeout: `${options.maxTimeout}ms`// The api requires specification of the time unit (s/ms)
    })).then(res => callback(null, res), err => {
      if (err.message.includes('not found')) {
        return callback()
      }
      return callback(err)
    })
  }
}

module.exports = DelegatedPeerRouting
