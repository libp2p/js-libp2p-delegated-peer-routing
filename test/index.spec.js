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
  it.only('calls find peer on the connected node', function (done) {
    this.timeout(100000)

    const factory = IPFSFactory.create({ type: 'go' })
    let ipfsd
    let routing
    let peer
    async.waterfall([
      (cb) => factory.spawn(cb),
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
      }
    ], done)
  })

  // skipping, as otherwise CI will randomly break
  it('calls find peer on the connected node (using ipfs.io)', function (done) {
    this.timeout(100000)
    const routing = new DelegatedPeerRouting()
    // TODO where is this peer coming from?
    const id = 'QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu'

    async.waterfall([
      (cb) => routing.findPeer(id, cb),
      (newPeer, cb) => {
        console.log(newPeer.multiaddrs)
        expect(newPeer.multiaddrs.size).to.be.within(4, 8)
        expect(newPeer.id).to.eql(id)
        cb()
      }
    ], done)
  })
})
