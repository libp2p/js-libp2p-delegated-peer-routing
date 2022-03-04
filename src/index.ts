import { logger } from '@libp2p/logger'
import { base58btc } from 'multiformats/bases/base58'
import PQueue from 'p-queue'
import defer from 'p-defer'
import type { PeerId } from '@libp2p/interfaces/peer-id'
import type { IPFSHTTPClient } from 'ipfs-http-client'
import type { HTTPClientExtraOptions } from 'ipfs-http-client/types/src/types'
import type { AbortOptions } from 'ipfs-core-types/src/utils'

const log = logger('libp2p-delegated-peer-routing')

const DEFAULT_TIMEOUT = 30e3 // 30 second default
const CONCURRENT_HTTP_REQUESTS = 4

export class DelegatedPeerRouting {
  private readonly client: IPFSHTTPClient
  private readonly httpQueue: PQueue

  /**
   * Create a new DelegatedPeerRouting instance
   */
  constructor (client: IPFSHTTPClient) {
    if (client == null) {
      throw new Error('missing ipfs http client')
    }

    this.client = client

    // limit concurrency to avoid request flood in web browser
    // https://github.com/libp2p/js-libp2p-delegated-content-routing/issues/12
    this.httpQueue = new PQueue({
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
   */
  async * findPeer (id: PeerId, options: HTTPClientExtraOptions & AbortOptions = {}) {
    log('findPeer starts: %p', id)
    options.timeout = options.timeout ?? DEFAULT_TIMEOUT

    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return await onFinish.promise
    })

    try {
      yield * this.client.dht.findPeer(id.toString(), {
        timeout: options.timeout
      })
    } catch (err: any) {
      log.error('findPeer errored: %o', err)

      if (err.message.includes('not found')) { // eslint-disable-line @typescript-eslint/strict-boolean-expressions
        return
      }

      throw err
    } finally {
      onFinish.resolve()
      log('findPeer finished: %p', id)
    }
  }

  /**
   * Attempt to find the closest peers on the network to the given key
   */
  async * getClosestPeers (key: Uint8Array, options: HTTPClientExtraOptions & AbortOptions = {}) {
    const keyStr = base58btc.encode(key).substring(1)

    log('getClosestPeers starts:', keyStr)
    options.timeout = options.timeout ?? DEFAULT_TIMEOUT

    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return await onFinish.promise
    })

    try {
      await onStart.promise

      yield * this.client.dht.query(keyStr, {
        timeout: options.timeout
      })
    } catch (err) {
      log.error('getClosestPeers errored:', err)
      throw err
    } finally {
      onFinish.resolve()
      log('getClosestPeers finished: %b', key)
    }
  }
}
