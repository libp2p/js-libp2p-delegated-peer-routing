/* eslint-env mocha */

import { expect } from 'aegir/utils/chai.js'
import { Controller, createFactory } from 'ipfsd-ctl'
import { isNode } from 'wherearewe'
import { create } from 'ipfs-http-client'
import { DelegatedPeerRouting } from '../src/index.js'
// @ts-expect-error no types
import goIpfs from 'go-ipfs'
import { peerIdFromString } from '@libp2p/peer-id'
import { createEd25519PeerId } from '@libp2p/peer-id-factory'
import all from 'it-all'
import type { IDResult } from 'ipfs-core-types/src/root'

const factory = createFactory({
  type: 'go',
  ipfsHttpModule: { create },
  ipfsBin: isNode ? goIpfs.path() : undefined,
  test: true,
  disposable: true,
  endpoint: 'http://localhost:57583'
})

async function spawnNode (bootstrap: any[] = []) {
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
      expect(() => new DelegatedPeerRouting()).to.throw()
    })

    it('should accept an http api client instance at construction time', () => {
      const client = create({
        protocol: 'http',
        port: 8000,
        host: 'localhost'
      })
      const router = new DelegatedPeerRouting(client)

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

      const router = new DelegatedPeerRouting(create({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const peer = await router.findPeer(peerIdFromString(peerIdToFind.id))

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()
      expect(id.equals(peerIdToFind.id)).to.be.true()
    })

    it('should be able to find peers via the delegate with a peerid', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting(create({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const peer = await router.findPeer(peerIdFromString(peerIdToFind.id))

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.toString()).to.eql(peerIdToFind.id)
    })

    it('should be able to specify a timeout', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting(create({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const peer = await router.findPeer(peerIdFromString(peerIdToFind.id), { timeout: 2000 })

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.toString()).to.eql(peerIdToFind.id)
    })

    it('should not be able to find peers not on the network', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting(create({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      // This is one of the default Bootstrap nodes, but we're not connected to it
      // so we'll test with it.
      await expect(router.findPeer(peerIdFromString('QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64')))
        .to.eventually.be.rejected.with.property('code', 'ERR_NOT_FOUND')
    })
  })

  describe('query', () => {
    it('should be able to query for the closest peers', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = new DelegatedPeerRouting(create({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const nodeId = await delegatedNode.api.id()
      const delegatePeerId = peerIdFromString(nodeId.id)

      const key = peerIdFromString(peerIdToFind.id).toBytes()

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

      const router = new DelegatedPeerRouting(create({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const nodeId = await delegatedNode.api.id()
      const delegatePeerId = peerIdFromString(nodeId.id)

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
})
