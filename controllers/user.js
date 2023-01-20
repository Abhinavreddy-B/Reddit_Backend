const express = require('express')
const bcrypt = require('bcrypt')
const config = require('../utils/config')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

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

    const existingUser = await User.findOne({userName})

    if(existingUser && existingUser !== null){
        return res.status(400).json({error: 'Username Already Exists'})
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

    const savedUser = await newUser.save()

    res.status(201).json(savedUser)
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

    const token = jwt.sign(toSend,config.Secret)

    res
    .status(200)
    .json({...toSend,token})
})

module.exports = UserRouter