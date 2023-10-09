import { createServer } from 'ipfsd-ctl'
import * as ipfsHttpModule from 'kubo-rpc-client'
import goIpfsModule from 'kubo'

let server

export default {
  test: {
    before: async () => {
      server = createServer({
        host: '127.0.0.1',
        port: 57583
      }, {
        type: 'go',
        ipfsHttpModule,
        ipfsBin: goIpfsModule.path(),
        test: true
      })

      await server.start()
    },
    after: () => server.stop()
  }
}
