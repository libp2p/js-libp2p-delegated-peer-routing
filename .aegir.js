'use strict'

const createServer = require('ipfsd-ctl').createServer

const server = createServer()

module.exports = {
  hooks: {
    browser: {
      pre: () => server.start(),
      post: () => server.stop()
    }
  }
}
