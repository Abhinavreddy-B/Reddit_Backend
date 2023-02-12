const config = require('./utils/config')
const logger = require('./utils/logger')
const app = require('./app') // the actual Express application
const http = require('http')
const cors = require('cors')
const IoFunction = require('./io')

const server = http.createServer(app)
const io = require("socket.io")(server,{
    cors: {
        origin: '*'
    }
});


app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", req.header('origin'));
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials","true");
    next();
})
// io.use();
io.on('connection', IoFunction)
server.listen(config.Port, () => {
    logger.info('Server running on port ', config.Port)
})