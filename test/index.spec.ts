/* eslint-env mocha */

import { expect } from 'aegir/chai'
import { Controller, createFactory } from 'ipfsd-ctl'
import { isElectronMain, isNode } from 'wherearewe'
import { create, Options, CID as IPFSCID } from 'ipfs-http-client'
import { delegatedPeerRouting } from '../src/index.js'
// @ts-expect-error no types
import goIpfs from 'go-ipfs'
import { peerIdFromString } from '@libp2p/peer-id'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import all from 'it-all'
import pDefer from 'p-defer'
import drain from 'it-drain'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import type { IDResult } from 'ipfs-core-types/src/root'
import { CID } from 'multiformats/cid'
import type { AbortOptions } from '@libp2p/interfaces'
import type { PeerId } from '@libp2p/interface-peer-id'
import { stop } from '@libp2p/interfaces/startable'
import { TimeoutController } from 'timeout-abort-controller'

const factory = createFactory({
  type: 'go',
  ipfsHttpModule: { create },
  ipfsBin: isNode || isElectronMain ? goIpfs.path() : undefined,
  test: true,
  disposable: true,
  endpoint: 'http://localhost:57583'
})

async function spawnNode (bootstrap: any[] = []): Promise<{ node: Controller, id: IDResult }> {
  const node = await factory.spawn({
    // Lock down the nodes so testing can be deterministic
    ipfsOptions: {
      config: {
        Bootstrap: bootstrap
      }
    }
  })
  const id = await node.api.id()

  return {
    node,
    id
  }
}

function createIpfsClient (opts: Options): any {
  const client = create(opts)

  return {
    getEndpointConfig: () => client.getEndpointConfig(),
    block: {
      async stat (cid: CID, options?: AbortOptions) {
        const result = await client.block.stat(IPFSCID.parse(cid.toString()), options)

        return {
          cid: CID.parse(result.cid.toString()),
          size: result.size
        }
      }
    },
    dht: {
      async * findPeer (peerId: PeerId, options?: AbortOptions) {
        // @ts-expect-error ipfs-http-client types are out of date
        yield * client.dht.findPeer(peerId, options)
      },
      async * query (peerId: PeerId | CID, options?: AbortOptions) {
        // @ts-expect-error ipfs-http-client types are out of date
        yield * client.dht.query(peerId, options)
      }
    }
  }
}

describe('DelegatedPeerRouting', function () {
  this.timeout(20 * 1000) // we're spawning daemons, give ci some time

  let nodeToFind: Controller
  let peerIdToFind: IDResult
  let delegatedNode: Controller
  let bootstrapNode: Controller
  let bootstrapId: IDResult

  before(async () => {
    // Spawn a "Boostrap" node that doesnt connect to anything
    const bootstrap = await spawnNode()
    bootstrapNode = bootstrap.node
    bootstrapId = bootstrap.id

    // Spawn our local node and bootstrap the bootstrapper node
    const local = await spawnNode(bootstrapId.addresses)
    nodeToFind = local.node
    peerIdToFind = local.id

    // Spawn the delegate node and bootstrap the bootstrapper node
    const delegate = await spawnNode(bootstrapId.addresses)
    delegatedNode = delegate.node
  })

  after(async () => {
    return await Promise.all([
      nodeToFind.stop(),
      delegatedNode.stop(),
      bootstrapNode.stop()
    ])
  })

  describe('create', () => {
    it('should require an http api client instance at construction time', () => {
      // @ts-expect-error invalid parameters
      expect(() => delegatedPeerRouting()()).to.throw()
    })

    it('should accept an http api client instance at construction time', () => {
      const client = createIpfsClient({
        protocol: 'http',
        port: 8000,
        host: 'localhost'
      })

      const router = delegatedPeerRouting(client)()

      expect(router).to.have.property('client')
        .that.has.property('getEndpointConfig')
        .that.is.a('function')

      expect(client.getEndpointConfig()).to.deep.include({
        protocol: 'http:',
        port: '8000',
        host: 'localhost'
      })
    })
  })

  describe('findPeers', () => {
    it('should be able to find peers via the delegate with a peer id string', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = delegatedPeerRouting(createIpfsClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))()

      const peer = await router.findPeer(peerIdToFind.id)

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.equals(peerIdToFind.id)).to.be.true()
    })

    it('should be able to find peers via the delegate with a peerid', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = delegatedPeerRouting(createIpfsClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))()

      const peer = await router.findPeer(peerIdToFind.id)

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.toString()).to.eql(peerIdToFind.id.toString())
    })

    it('should be able to specify a timeout', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = delegatedPeerRouting(createIpfsClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))()
      const controller = new TimeoutController(5e3)

      const peer = await router.findPeer(peerIdToFind.id, { signal: controller.signal })

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.toString()).to.eql(peerIdToFind.id.toString())

      controller.clear()
    })

    it('should not be able to find peers not on the network', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = delegatedPeerRouting(createIpfsClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))()

      // This is one of the default Bootstrap nodes, but we're not connected to it
      // so we'll test with it.
      await expect(router.findPeer(peerIdFromString('QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64')))
        .to.eventually.be.rejected.with.property('code', 'ERR_NOT_FOUND')
    })
  })

  describe('query', () => {
    it('should be able to query for the closest peers', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = delegatedPeerRouting(createIpfsClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))()

      const nodeId = await delegatedNode.api.id()
      const delegatePeerId = nodeId.id

      const key = peerIdToFind.id.toBytes()

      const closerPeers = await all(router.getClosestPeers(key))

      // we should be closest to the 2 other peers
      expect(closerPeers.length).to.equal(2)
      closerPeers.forEach(result => {
        // shouldn't be the delegate

        expect(delegatePeerId.equals(result.id)).to.equal(false)
        expect(result.multiaddrs).to.be.an('array')
      })
    })

    it('should find closest peers even if the peer does not exist', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = delegatedPeerRouting(createIpfsClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))()

      const nodeId = await delegatedNode.api.id()
      const delegatePeerId = nodeId.id

      const peerId = await createEd25519PeerId()
      const closerPeers = await all(router.getClosestPeers(peerId.toBytes()))

      // we should be closest to the 2 other peers
      expect(closerPeers.length).to.equal(2)
      closerPeers.forEach(result => {
        // shouldnt be the delegate

        expect(delegatePeerId.equals(result.id)).to.equal(false)
        expect(result.multiaddrs).to.be.an('array')
      })
    })
  })

  describe('stop', () => {
    it('should cancel in-flight requests when stopping', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = delegatedPeerRouting(createIpfsClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))()

      const deferred = pDefer<Error>()
      const peer = uint8ArrayFromString('QmVv4Wz46JaZJeH5PMV4LGbRiiMKEmszPYY3g6fjGnVXBs', 'base58btc')

      void drain(router.getClosestPeers(peer))
        .then(() => {
          deferred.reject(new Error('Did not abort'))
        })
        .catch(err => {
          deferred.resolve(err)
        })

      await stop(router)
      await expect(deferred.promise).to.eventually.have.property('message').that.matches(/aborted/)
    })
  })
})
