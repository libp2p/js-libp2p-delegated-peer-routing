/* eslint-env mocha */
'use strict'

const chai = require('chai')
const { expect } = chai
chai.use(require('dirty-chai'))
const { createFactory } = require('ipfsd-ctl')
const PeerID = require('peer-id')
const { isNode } = require('ipfs-utils/src/env')

const DelegatedPeerRouting = require('../src')
const factory = createFactory({
  type: 'go',
  ipfsHttpModule: require('ipfs-http-client'),
  ipfsBin: isNode ? require('go-ipfs-dep').path() : undefined,
  test: true,
  endpoint: 'http://localhost:57483'
})

async function spawnNode (boostrap = []) {
  const node = await factory.spawn({
    // Lock down the nodes so testing can be deterministic
    ipfsOptions: {
      config: {
        Bootstrap: boostrap,
        Discovery: {
          MDNS: {
            Enabled: false
          }
        }
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
    it('should default to https://node0.delegate.ipfs.io as the delegate', () => {
      const router = new DelegatedPeerRouting()

      expect(router.api).to.include({
        protocol: 'https',
        port: 443,
        host: 'node0.delegate.ipfs.io'
      })
    })

    it('should allow for just specifying the host', () => {
      const router = new DelegatedPeerRouting({
        host: 'other.ipfs.io'
      })

      expect(router.api).to.include({
        protocol: 'https',
        port: 443,
        host: 'other.ipfs.io'
      })
    })

    it('should allow for overriding the api', () => {
      const api = {
        apiPath: '/api/v1',
        protocol: 'http',
        port: 8000,
        host: 'localhost'
      }
      const router = new DelegatedPeerRouting(api)

      expect(router.api).to.include(api)
    })
  })

  describe('findPeers', () => {
    it('should be able to find peers via the delegate with a peer id string', async () => {
      const opts = delegatedNode.apiAddr.toOptions()

      const router = new DelegatedPeerRouting({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      })

      const { id, multiaddrs } = await router.findPeer(peerIdToFind.id)
      expect(id).to.exist()
      expect(multiaddrs).to.exist()
      expect(id).to.eql(peerIdToFind.id)
    })

    it('should be able to find peers via the delegate with a peerid', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      })

      const { id, multiaddrs } = await router.findPeer(PeerID.createFromB58String(peerIdToFind.id))
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.toB58String()).to.eql(peerIdToFind.id)
    })

    it('should be able to specify a timeout', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      })

      const { id, multiaddrs } = await router.findPeer(PeerID.createFromB58String(peerIdToFind.id), { timeout: 2000 })
      expect(id).to.exist()
      expect(multiaddrs).to.exist()

      expect(id.toB58String()).to.eql(peerIdToFind.id)
    })

    it('should not be able to find peers not on the network', async () => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      })

      // This is one of the default Bootstrap nodes, but we're not connected to it
      // so we'll test with it.
      const peer = await router.findPeer('QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64')
      expect(peer).to.not.exist()
    })
  })
})
