const express = require('express')
const mongoose = require('mongoose')
const config = require('./utils/config')
const app = express()

mongoose.connect(config.MongoUri).then(() => {
    console.log("Connected to Database")
}).catch((err) => {
    console.log("Unable to connect to Database")
    console.log(err)
})


const cors = require('cors')
app.use(cors())
app.use(express.json())

const middleware = require('./utils/middleware')
app.use(middleware.requestlogger)

var fileupload = require("express-fileupload");
app.use(fileupload())

const UserRouter = require('./controllers/user')
app.use('/api/users',UserRouter)

const SubGredditRouter = require('./controllers/subGreddit')
app.use('/api/subgreddit',middleware.tokenExtractor,middleware.userExtractor,SubGredditRouter)

const PostsRouter = require('./controllers/Posts')
app.use('/api/post',middleware.tokenExtractor,middleware.userExtractor,PostsRouter)

const ReportsRouter = require('./controllers/Reports')
app.use('/api/report',middleware.tokenExtractor,middleware.userExtractor,ReportsRouter)

const StatsRouter = require('./controllers/Stats')
app.use('/api/stats',middleware.tokenExtractor,middleware.userExtractor,StatsRouter)

// app.use(middleware.errorHandler)

module.exports = app