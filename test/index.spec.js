/* eslint-env mocha */
'use strict'

const { expect } = require('aegir/utils/chai')
const { createFactory } = require('ipfsd-ctl')
const PeerID = require('peer-id')
const { isNode } = require('ipfs-utils/src/env')
const concat = require('it-all')
const ipfsHttpClient = require('ipfs-http-client')

const DelegatedPeerRouting = require('../src')
const factory = createFactory({
  type: 'go',
  ipfsHttpModule: require('ipfs-http-client'),
  ipfsBin: isNode ? require('go-ipfs').path() : undefined,
  test: true,
  disposable: true,
  endpoint: 'http://localhost:57483'
})

async function spawnNode (boostrap = []) {
  const node = await factory.spawn({
    // Lock down the nodes so testing can be deterministic
    ipfsOptions: {
      config: {
        Bootstrap: boostrap
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

  let nodeToFind
  let peerIdToFind
  let delegatedNode
  let bootstrapNode
  let bootstrapId

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

  after(() => {
    return Promise.all([
      nodeToFind.stop(),
      delegatedNode.stop(),
      bootstrapNode.stop()
    ])
  })

  describe('create', () => {
    it('should require an http api client instance at construction time', () => {
      expect(() => new DelegatedPeerRouting()).to.throw()
    })

    it('should accept an http api client instance at construction time', () => {
      const client = ipfsHttpClient({
        protocol: 'http',
        port: 8000,
        host: 'localhost'
      })
      const router = new DelegatedPeerRouting(client)

      expect(router).to.have.property('_client')
        .that.has.property('getEndpointConfig')
        .that.is.a('function')

      expect(router._client.getEndpointConfig()).to.deep.include({
        protocol: 'http:',
        port: '8000',
        host: 'localhost'
      })
    })
  })

  describe('findPeers', () => {
    it('should be able to find peers via the delegate with a peer id string', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = new DelegatedPeerRouting(ipfsHttpClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const peer = await router.findPeer(peerIdToFind.id)
      expect(peer).to.be.ok()

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()
      expect(id).to.eql(peerIdToFind.id)
    })

    it('should be able to find peers via the delegate with a peerid', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting(ipfsHttpClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const peer = await router.findPeer(PeerID.createFromB58String(peerIdToFind.id))
      expect(peer).to.be.ok()

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.toB58String()).to.eql(peerIdToFind.id)
    })

    it('should be able to specify a timeout', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting(ipfsHttpClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const peer = await router.findPeer(PeerID.createFromB58String(peerIdToFind.id), { timeout: 2000 })
      expect(peer).to.be.ok()

      const { id, multiaddrs } = peer
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.toB58String()).to.eql(peerIdToFind.id)
    })

    it('should not be able to find peers not on the network', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting(ipfsHttpClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      // This is one of the default Bootstrap nodes, but we're not connected to it
      // so we'll test with it.
      const peer = await router.findPeer('QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64')
      expect(peer).to.not.exist()
    })
  })

  describe('query', () => {
    it('should be able to query for the closest peers', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = new DelegatedPeerRouting(ipfsHttpClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const nodeId = await delegatedNode.api.id()
      const delegatePeerId = PeerID.createFromCID(nodeId.id)

      const key = PeerID.createFromB58String(peerIdToFind.id).id
      const results = await concat(router.getClosestPeers(key))

      // we should be closest to the 2 other peers
      expect(results.length).to.equal(2)
      results.forEach(result => {
        // shouldnt be the delegate
        expect(delegatePeerId.equals(result.id)).to.equal(false)
        expect(result.multiaddrs).to.be.an('array')
      })
    })

    it('should find closest peers even if the peer doesnt exist', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = new DelegatedPeerRouting(ipfsHttpClient({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      }))

      const nodeId = await delegatedNode.api.id()
      const delegatePeerId = PeerID.createFromCID(nodeId.id)

      const peerId = await PeerID.create({ keyType: 'ed25519' })
      const results = await concat(router.getClosestPeers(peerId.id))

      // we should be closest to the 2 other peers
      expect(results.length).to.equal(2)
      results.forEach(result => {
        // shouldnt be the delegate
        expect(delegatePeerId.equals(result.id)).to.equal(false)
        expect(result.multiaddrs).to.be.an('array')
      })
    })
  })
})
