import { logger } from '@libp2p/logger'
import { CID } from 'multiformats/cid'
import PQueue from 'p-queue'
import defer from 'p-defer'
import errCode from 'err-code'
import anySignal from 'any-signal'
import type { PeerId } from '@libp2p/interface-peer-id'
import type { IPFSHTTPClient, HTTPClientExtraOptions } from 'ipfs-http-client'
import type { AbortOptions } from 'ipfs-core-types/src/utils'
import type { PeerRouting } from '@libp2p/interface-peer-routing'
import type { PeerInfo } from '@libp2p/interface-peer-info'
import type { Startable } from '@libp2p/interfaces/startable'
import { peerIdFromBytes } from '@libp2p/peer-id'

const log = logger('libp2p-delegated-peer-routing')

const DEFAULT_TIMEOUT = 30e3 // 30 second default
const CONCURRENT_HTTP_REQUESTS = 4

export class DelegatedPeerRouting implements PeerRouting, Startable {
  private readonly client: IPFSHTTPClient
  private readonly httpQueue: PQueue
  private started: boolean
  private abortController: AbortController

  /**
   * Create a new DelegatedPeerRouting instance
   */
  constructor (client: IPFSHTTPClient) {
    if (client == null) {
      throw new Error('missing ipfs http client')
    }

    this.client = client
    this.started = false
    this.abortController = new AbortController()

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

  isStarted () {
    return this.started
  }

  start () {
    this.started = true
  }

  stop () {
    this.httpQueue.clear()
    this.abortController.abort()
    this.abortController = new AbortController()
    this.started = false
  }

  /**
   * Attempts to find the given peer
   */
  async findPeer (id: PeerId, options: HTTPClientExtraOptions & AbortOptions = {}) {
    log('findPeer starts: %p', id)
    options.timeout = options.timeout ?? DEFAULT_TIMEOUT
    options.signal = anySignal([this.abortController.signal].concat((options.signal != null) ? [options.signal] : []))

    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return await onFinish.promise
    })

    try {
      await onStart.promise

      for await (const event of this.client.dht.findPeer(id, options)) {
        if (event.name === 'FINAL_PEER') {
          const peerInfo: PeerInfo = {
            id: event.peer.id,
            multiaddrs: event.peer.multiaddrs,
            protocols: []
          }

          return peerInfo
        }
      }
    } catch (err: any) {
      log.error('findPeer errored: %o', err)

      throw err
    } finally {
      onFinish.resolve()
      log('findPeer finished: %p', id)
    }

    throw errCode(new Error('Not found'), 'ERR_NOT_FOUND')
  }

  /**
   * Attempt to find the closest peers on the network to the given key
   */
  async * getClosestPeers (key: Uint8Array, options: HTTPClientExtraOptions & AbortOptions = {}) {
    let cidOrPeerId: CID | PeerId
    const cid = CID.asCID(key)

    if (cid != null) {
      cidOrPeerId = cid
    } else {
      cidOrPeerId = peerIdFromBytes(key)
    }

    log('getClosestPeers starts: %s', cidOrPeerId)
    options.timeout = options.timeout ?? DEFAULT_TIMEOUT
    options.signal = anySignal([this.abortController.signal].concat((options.signal != null) ? [options.signal] : []))

    const onStart = defer()
    const onFinish = defer()

    void this.httpQueue.add(async () => {
      onStart.resolve()
      return await onFinish.promise
    })

    try {
      await onStart.promise

      for await (const event of this.client.dht.query(cidOrPeerId, options)) {
        if (event.name === 'PEER_RESPONSE') {
          yield * event.closer.map(closer => ({
            id: closer.id,
            multiaddrs: closer.multiaddrs,
            protocols: []
          }))
        }
      }
    } catch (err) {
      log.error('getClosestPeers errored:', err)
      throw err
    } finally {
      onFinish.resolve()
      log('getClosestPeers finished: %b', key)
    }
  }
}
