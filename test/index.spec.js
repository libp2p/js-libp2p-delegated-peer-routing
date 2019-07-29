/* eslint-env mocha */
'use strict'

const chai = require('chai')
const { expect } = chai
chai.use(require('dirty-chai'))
const IPFSFactory = require('ipfsd-ctl')
const async = require('async')
const PeerID = require('peer-id')

const DelegatedPeerRouting = require('../src')
const factory = IPFSFactory.create({ type: 'go' })

function spawnNode (boostrap, callback) {
  if (typeof boostrap === 'function') {
    callback = boostrap
    boostrap = []
  }

  factory.spawn({
    // Lock down the nodes so testing can be deterministic
    config: {
      Bootstrap: boostrap,
      Discovery: {
        MDNS: {
          Enabled: false
        }
      }
    }
  }, (err, node) => {
    if (err) return callback(err)

    node.api.id((err, id) => {
      if (err) return callback(err)

      callback(null, node, id)
    })
  })
}

describe('DelegatedPeerRouting', function () {
  this.timeout(20 * 1000) // we're spawning daemons, give ci some time

  let nodeToFind
  let peerIdToFind
  let delegatedNode
  let bootstrapNode
  let bootstrapId

  before((done) => {
    async.waterfall([
      // Spawn a "Boostrap" node that doesnt connect to anything
      (cb) => spawnNode(cb),
      (ipfsd, id, cb) => {
        bootstrapNode = ipfsd
        bootstrapId = id
        cb()
      },
      // Spawn our local node and bootstrap the bootstrapper node
      (cb) => spawnNode(bootstrapId.addresses, cb),
      (ipfsd, id, cb) => {
        nodeToFind = ipfsd
        peerIdToFind = id
        cb()
      },
      // Spawn the delegate node and bootstrap the bootstrapper node
      (cb) => spawnNode(bootstrapId.addresses, cb),
      (ipfsd, id, cb) => {
        delegatedNode = ipfsd
        cb()
      }
    ], done)
  })

  after((done) => {
    async.parallel([
      (cb) => nodeToFind.stop(cb),
      (cb) => delegatedNode.stop(cb),
      (cb) => bootstrapNode.stop(cb)
    ], done)
  })

  describe('create', () => {
    it('should default to https://node0.delegate.ipfs.io as the delegate', () => {
      const router = new DelegatedPeerRouting()

      expect(router.api).to.include({
        'api-path': '/api/v0/',
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
        'api-path': '/api/v0/',
        protocol: 'https',
        port: 443,
        host: 'other.ipfs.io'
      })
    })

    it('should allow for overriding the api', () => {
      const api = {
        'api-path': '/api/v1/',
        protocol: 'http',
        port: 8000,
        host: 'localhost'
      }
      const router = new DelegatedPeerRouting(api)

      expect(router.api).to.include(api)
    })
  })

  describe('findPeers', () => {
    it('should be able to find peers via the delegate with a peer id string', (done) => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      })

      router.findPeer(peerIdToFind.id, (err, peer) => {
        expect(err).to.not.exist()
        expect(peer).to.exist()
        expect(peer.id.toB58String()).to.eql(peerIdToFind.id)
        done()
      })
    })

    it('should be able to find peers via the delegate with a peerid', (done) => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      })

      router.findPeer(PeerID.createFromB58String(peerIdToFind.id), (err, peer) => {
        expect(err).to.not.exist()
        expect(peer).to.exist()
        expect(peer.id.toB58String()).to.eql(peerIdToFind.id)
        done()
      })
    })

    it('should be able to specify a maxTimeout', (done) => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      })

      router.findPeer(PeerID.createFromB58String(peerIdToFind.id), { maxTimeout: 2000 }, (err, peer) => {
        expect(err).to.not.exist()
        expect(peer).to.exist()
        expect(peer.id.toB58String()).to.eql(peerIdToFind.id)
        done()
      })
    })

    it('should not be able to find peers not on the network', (done) => {
      const opts = delegatedNode.apiAddr.toOptions()
      const router = new DelegatedPeerRouting({
        protocol: 'http',
        port: opts.port,
        host: opts.host
      })

      // This is one of the default Bootstrap nodes, but we're not connected to it
      // so we'll test with it.
      router.findPeer('QmSoLV4Bbm51jM9C4gDYZQ9Cy3U6aXMJDAbzgu2fzaDs64', (err, peer) => {
        expect(err).to.not.exist()
        expect(peer).to.not.exist()
        done()
      })
    })
  })
})
