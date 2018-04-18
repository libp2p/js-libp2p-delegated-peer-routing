/* eslint-env mocha */
'use strict'

const expect = require('chai').expect
const IPFSFactory = require('ipfsd-ctl')
const async = require('async')

const DelegatedPeerRouting = require('../src')

describe('DelegatedPeerRouting', () => {
  it('calls find peer on the connected node', function (done) {
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
        expect(newPeer.id).to.be.eql(peer.peer.toB58String())
        cb()
      }
    ], done)
  })

  // skipping, as otherwise CI will randomly break
  it.skip('calls find peer on the connected node (using ipfs.io)', function (done) {
    this.timeout(100000)
    const routing = new DelegatedPeerRouting()
    const id = 'Qmbut9Ywz9YEDrz8ySBSgWyJk41Uvm2QJPhwDJzJyGFsD6'

    async.waterfall([
      (cb) => routing.findPeer(id, cb),
      (newPeer, cb) => {
        expect(newPeer.multiaddrs.size).to.be.above(0)
        expect(newPeer.id).to.be.eql(id)
        cb()
      }
    ], done)
  })
})
