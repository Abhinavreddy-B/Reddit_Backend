const jwt = require('jsonwebtoken')
const User = require('../models/user')

const VerifyFollow = async (token,ChatWith) => {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    if (!decodedToken.id) {
        return {error: 'Missing authentication token'}
    }

    const user = await User.findById(decodedToken.id)

    // ? If not mutually following:
    if(user.Followers.find(f => f.toString() === ChatWith) && user.Following.find(f => f.toString() === ChatWith)){
        return true
    }
    return {error: 'You are not mutually following'}
}

const getUserId = async (token) => {
    const decodedToken = jwt.verify(token, process.env.SECRET)
    const user = await User.findById(decodedToken.id)
    return user._id.toString()
}

module.exports = { VerifyFollow, getUserId }