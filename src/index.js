'use strict'

const PeerId = require('peer-id')
const { base58btc } = require('multiformats/bases/base58')
const { default: PQueue } = require('p-queue')
const defer = require('p-defer')
const debug = require('debug')

const log = debug('libp2p-delegated-peer-routing')
log.error = debug('libp2p-delegated-peer-routing:error')

const DEFAULT_TIMEOUT = 30e3 // 30 second default
const CONCURRENT_HTTP_REQUESTS = 4

class DelegatedPeerRouting {
  /**
   * Create a new DelegatedPeerRouting instance.
   *
   * @param {object} client - an instance of the ipfs-http-client module
   */
  constructor (client) {
    if (client == null) {
      throw new Error('missing ipfs http client')
    }

    this._client = client

    // limit concurrency to avoid request flood in web browser
    // https://github.com/libp2p/js-libp2p-delegated-content-routing/issues/12
    this._httpQueue = new PQueue({
      concurrency: CONCURRENT_HTTP_REQUESTS
    })

    const {
      protocol,
      host,
      port
    } = client.getEndpointConfig()

    log(`enabled DelegatedPeerRouting via ${protocol}://${host}:${port}`)
  }

  /**
   * Attempts to find the given peer
   *
   * @param {PeerID} id
   * @param {object} options
   * @param {number} options.timeout - How long the query can take. Defaults to 30 seconds
   * @returns {Promise<{ id: PeerId, multiaddrs: Multiaddr[] }>}
   */
  async findPeer (id, options = {}) {
    let idStr = id
    if (PeerId.isPeerId(idStr)) {
      idStr = id.toB58String()
    }

    log('findPeer starts: ' + id)

    options.timeout = options.timeout || DEFAULT_TIMEOUT

    try {
      return await this._httpQueue.add(async () => {
        const { addrs } = await this._client.dht.findPeer(idStr, {
          timeout: options.timeout
        })

        return {
          id,
          multiaddrs: addrs
        }
      })
    } catch (err) {
      if (err.message.includes('not found')) {
        return undefined
      }

      throw err
    } finally {
      log('findPeer finished: ' + id)
    }
  }

  /**
   * Attempt to find the closest peers on the network to the given key
   *
   * @param {Uint8Array} key - A CID like key
   * @param {object} [options]
   * @param {number} [options.timeout=30e3] - How long the query can take.
   * @returns {AsyncIterable<{ id: PeerId, multiaddrs: Multiaddr[] }>}
   */
  async * getClosestPeers (key, options = {}) {
    const keyStr = base58btc.encode(key).substring(1)

    log('getClosestPeers starts:', keyStr)
    options.timeout = options.timeout || DEFAULT_TIMEOUT

    const onStart = defer()
    const onFinish = defer()

    this._httpQueue.add(() => {
      onStart.resolve()
      return onFinish.promise
    })

    try {
      await onStart.promise

      const peers = new Map()

      for await (const result of this._client.dht.query(keyStr, {
        timeout: options.timeout
      })) {
        switch (result.type) {
          case 1: // Found Closer
            // Track the addresses, so we can yield them when done
            result.responses.forEach(response => {
              peers.set(response.id, {
                id: PeerId.parse(response.id),
                multiaddrs: response.addrs
              })
            })
            break
          case 2: // Final Peer
            yield peers.get(result.id.string) || {
              id: PeerId.createFromCID(result.id),
              multiaddrs: []
            }
            break
          default:
            log('getClosestPeers unhandled response', result)
        }
      }
    } catch (err) {
      log.error('getClosestPeers errored:', err)
      throw err
    } finally {
      onFinish.resolve()
      log('getClosestPeers finished:', keyStr)
    }
  }
}

module.exports = DelegatedPeerRouting
