'use strict'

const PeerId = require('peer-id')
const dht = require('ipfs-http-client/src/dht')
const defaultConfig = require('ipfs-http-client/src/utils/default-config')
const { default: PQueue } = require('p-queue')
const debug = require('debug')

const log = debug('libp2p-delegated-peer-routing')
log.error = debug('libp2p-delegated-peer-routing:error')

const DEFAULT_MAX_TIMEOUT = 30e3 // 30 second default
const DEFAULT_IPFS_API = {
  protocol: 'https',
  port: 443,
  host: 'node0.delegate.ipfs.io'
}
const CONCURRENT_HTTP_REQUESTS = 4

class DelegatedPeerRouting {
  constructor (api) {
    this.api = Object.assign({}, defaultConfig(), DEFAULT_IPFS_API, api)
    this.dht = dht(this.api)

    // limit concurrency to avoid request flood in web browser
    // https://github.com/libp2p/js-libp2p-delegated-content-routing/issues/12
    this._httpQueue = new PQueue({
      concurrency: CONCURRENT_HTTP_REQUESTS
    })
    log(`enabled DelegatedPeerRouting via ${this.api.protocol}://${this.api.host}:${this.api.port}`)
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
    log('findPeer starts: ' + id)

    options.maxTimeout = options.maxTimeout || DEFAULT_MAX_TIMEOUT

    try {
      return await this._httpQueue.add(() => this.dht.findPeer(id, {
        timeout: `${options.maxTimeout}ms`// The api requires specification of the time unit (s/ms)
      }))
    } catch (err) {
      if (err.message.includes('not found')) {
        return undefined
      }

      throw err
    } finally {
      log('findPeer finished: ' + id)
    }
  }
}

module.exports = DelegatedPeerRouting
