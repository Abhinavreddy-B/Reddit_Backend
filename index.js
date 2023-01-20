const config = require('./utils/config')
const logger = require('./utils/logger')
const app = require('./app') // the actual Express application
const http = require('http')

const server = http.createServer(app)

server.listen(config.Port, () => {
    logger.info('Server running on port ', config.Port)
})