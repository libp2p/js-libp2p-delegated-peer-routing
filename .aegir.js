'use strict'

const { createServer } = require('ipfsd-ctl')
let server

module.exports = {
  hooks: {
    browser: {
      pre: async () => {
        server = createServer({
          host: '127.0.0.1',
          port: 57483
        }, {
          type: 'go',
          ipfsHttpModule: require('ipfs-http-client'),
          ipfsBin: require('go-ipfs').path(),
          test: true
        })

        await server.start()
      },
      post: () => server.stop()
    }
  }
}
