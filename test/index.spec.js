/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const IPFSFactory = require('ipfsd-ctl')
const async = require('async')

const DelegatedPeerRouting = require('../src')

const getPeerMultiaddrs = (peer) => {
  return peer.multiaddrs.toArray().map(ma => ma.toString())
}

describe('DelegatedPeerRouting', () => {
  it('calls find peer on the connected node', function (done) {
    this.timeout(1000 * 300)

    const factory = IPFSFactory.create({ type: 'go' })
    let ipfsd
    let routing
    let peer
    async.waterfall([
      (cb) => factory.spawn({
        defaultAddrs: [
          '/ip4/127.0.0.1/tcp/0'
        ]
      }, cb),
      (_ipfsd, cb) => {
        ipfsd = _ipfsd
        const opts = ipfsd.apiAddr.toOptions()
        routing = new DelegatedPeerRouting({
          protocol: 'http',
          port: opts.port,
          host: opts.host
        })
        ipfsd.api.swarm.peers(cb)
      },
      (peers, cb) => {
        peer = peers[0]
        const id = peer.peer.toB58String()
        routing.findPeer(id, cb)
      },
      (newPeer, cb) => {
        expect(newPeer.multiaddrs.size).to.be.above(0)
        expect(getPeerMultiaddrs(newPeer)).to.contain(peer.addr.toString())
        expect(newPeer.id).to.be.eql(peer.peer.toB58String())
        cb()
      }, (cb) => {
        ipfsd.stop(cb)
      }
    ], done)
  })

  // skipping, as otherwise CI will randomly break
  it('calls find peer on the connected node (using ipfs.io)', function (done) {
    this.timeout(1000 * 10)
    const routing = new DelegatedPeerRouting()
    // Solus Bootstrapper Node ID
    const id = 'QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu'
    // List of multiaddrs we know Solus should at least have
    // Bit risky to have in the tests as we can't guarantee that they will be returned...
    const knownMultiaddrs = [
      '/ip6/::1/tcp/4001',
      // '/ip4/127.0.0.1/tcp/8081/ws', sometimes not included, but should...
      '/ip4/127.0.0.1/tcp/4001',
      '/ip4/10.15.0.5/tcp/4001',
      '/ip4/128.199.219.111/tcp/4001',
      '/ip6/2400:6180:0:d0::151:6001/tcp/4001',
      '/ip4/172.17.0.1/tcp/4001',
      '/ip6/fc4e:5427:3cd0:cc4c:4770:25bb:a682:d06c/tcp/4001'
    ]

    async.waterfall([
      (cb) => routing.findPeer(id, cb),
      (newPeer, cb) => {
        // ID matches what we wanted
        expect(newPeer.id).to.eql(id)
        // Should have at least one multiaddr
        expect(newPeer.multiaddrs.size).to.be.above(0)
        // Should contain multiaddrs we know peer to have
        const receivedMultiaddrs = getPeerMultiaddrs(newPeer)
        knownMultiaddrs.forEach((ma) => {
          expect(receivedMultiaddrs).to.contain(ma)
        })
        cb()
      }
    ], done)
  })
})
