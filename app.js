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

const UserRouter = require('./controllers/user')
app.use('/api/users',UserRouter)

app.use(middleware.errorHandler)

module.exports = app