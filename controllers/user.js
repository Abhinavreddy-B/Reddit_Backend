const express = require('express')
const bcrypt = require('bcrypt')
const config = require('../utils/config')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const middleware = require('../utils/middleware')

const UserRouter = express.Router()

UserRouter.post('/signup', async (req, res, next) => {
    const { firstName,
        lastName,
        userName,
        Email,
        Age,
        ContactNumber,
        password } = req.body

    if (!password || !userName) {
        return res.status(400).json({ error: 'username and password required' })
    }

    const existingUser = await User.findOne({ userName })

    if (existingUser && existingUser !== null) {
        return res.status(400).json({ error: 'Username Already Exists' })
    }

    const saltRounds = 10
    const pwHashed = await bcrypt.hash(password, saltRounds)

    const newUser = new User({
        firstName,
        lastName,
        userName,
        Email,
        Age,
        ContactNumber,
        passwordHash: pwHashed
    })

    try {
        const savedUser = await newUser.save()
        res.status(201).json(savedUser)
    } catch (e) {
        next(e)
    }

})

UserRouter.post('/login', async (req, res, next) => {
    const { userName, password } = req.body
    if (!userName || !password) {
        return res.status(400).json({ error: 'malformed Username/password' })
    }

    const user = await User.findOne({ userName })
    if (user === null) {
        return res.status(401).json({ error: 'invalid credentials' })
    }

    const pwHashed = user.passwordHash

    const checkpw = await bcrypt.compare(password, pwHashed)

    if (checkpw === false) {
        return res.status(401).json({ error: 'invalid credentials' })
    }

    const toSend = {
        userName: user.userName,
        id: user._id,
    }

    const token = jwt.sign(toSend, config.Secret)

    res
        .status(200)
        .json({ ...toSend, token })
})

UserRouter.get('/', middleware.tokenExtractor, middleware.userExtractor, async (req, res, next) => {
    return res.status(200).json(req.user)
})

UserRouter.put('/', middleware.tokenExtractor, middleware.userExtractor, async (req, res, next) => {
    const { firstName,
        lastName,
        Email,
        Age,
        ContactNumber,
        password } = req.body

    const user = req.user
    const oldpwHash = user.passwordHash

    const newuser = {
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        Email: Email || user.Email,
        Age: Age || user.Age,
        ContactNumber: ContactNumber || user.ContactNumber,
    }

    try {
        if (password) {
            const SaltRounds = 10
            const newpwHash = await bcrypt.hash(password, SaltRounds)
            newuser.passwordHash = newpwHash
        } else {
            newuser.passwordHash = oldpwHash
        }
        await User.findOneAndUpdate(user,newuser)
        return res.status(200).json(await User.findById(user._id))
    } catch(e){
        console.log(e)
        return res.status(400).json({error: 'internal error, Unable to Update'})
    }
})

module.exports = UserRouter