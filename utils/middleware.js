const logger = require('./logger')
const jwt = require('jsonwebtoken')
const User = require('../models/user')


const tokenExtractor = (request, response, next) => {
    const authorization = request.get('authorization')
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        request.token = authorization.substring(7)
    } else {
        return response.status(401).json({error: 'token missing or invalid'})
    }
    next()
}

const userExtractor = async (request,response,next) => {
    try{
        const token = request.token
        const decodedToken = jwt.verify(token, process.env.SECRET)
        if (!decodedToken.id) {
          return response.status(401).json({ error: 'token missing or invalid' })
        }

        request.user = await User.findById(decodedToken.id)
        next()
    }catch(error){
        if (error.name === 'JsonWebTokenError') {
            return response.status(401).json({
                error: 'invalid token'
            })
        } else if (error.name === 'TokenExpiredError') {
            return response.status(401).json({
                error: 'token expired'
            })
        }
    }
}

const requestlogger = (request, response, next) => {
    logger.info('METHOD: ', request.method)
    logger.info('PATH: ', request.path)
    logger.info('BODY: ', request.body)
    logger.info('--------')
    next()
}

const errorHandler = (error, request, response, next) => {
    console.error(error.message)
    console.log('Entered Error Handler')
    if (error.name === 'CastError') {
        return response.status(404).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    } else if (error.name === 'MongoServerError') {
        return response.status(400).json({ error: 'Entry Already Exists At Server, Kindly refresh the Page' })
    } else if (error.name === 'JsonWebTokenError') {
        return response.status(401).json({
            error: 'invalid token'
        })
    } else if (error.name === 'TokenExpiredError') {
        return response.status(401).json({
            error: 'token expired'
        })
    }
    next(error)
}

module.exports = { requestlogger, errorHandler, tokenExtractor, userExtractor}