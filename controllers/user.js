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
        passwordHash: pwHashed,
        FollowerCount: 0,
        Followers: [],
        FollowingCount: 0,
        Following: [],
        Saved: [],
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
        Name: user.firstName+' '+user.lastName,
    }

    const token = jwt.sign(toSend, config.Secret)

    res
        .status(200)
        .json({ ...toSend, token })
})

UserRouter.get('/', middleware.tokenExtractor, middleware.userExtractor, async (req, res, next) => {
    const { firstName, lastName, userName, Email, Age, ContactNumber, FollowerCount, FollowingCount } = req.user
    return res.status(200).json({ firstName, lastName, userName, Email, Age, ContactNumber, FollowerCount, FollowingCount })
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
        await User.findOneAndUpdate(user, newuser)
        return res.status(200).json(await User.findById(user._id))
    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: 'internal error, Unable to Update' })
    }
})

UserRouter.get('/followers', middleware.tokenExtractor, middleware.userExtractor, async (req, res, next) => {
    const followers = await User.findById(req.user._id, { Followers: true }).populate('Followers', { firstName: true, lastName: true, _id: true })
    // console.log(followers.Followers)
    res.status(200).json(followers.Followers)
})

UserRouter.get('/following', middleware.tokenExtractor, middleware.userExtractor, async (req, res, next) => {
    const followers = await User.findById(req.user._id, { Following: true }).populate('Following', { firstName: true, lastName: true, _id: true })
    // console.log(followers.Following)
    res.status(200).json(followers.Following)
})

UserRouter.post('/followers/remove', middleware.tokenExtractor, middleware.userExtractor, async (req, res, next) => {
    let user = req.user
    const { FollowerId } = req.body

    try {

        let Follower = await User.findById(FollowerId)

        if (user.Followers.find(f => f.toString() === FollowerId) && Follower.Following.find(f => f.toString() === user._id.toString())) {
            user.Followers = user.Followers.filter(f => f._id.toString() !== FollowerId)
            user.FollowerCount -= 1
            await user.save()

            Follower.Following = Follower.Following.filter(f => f._id.toString() !== user._id.toString())
            Follower.FollowingCount -= 1
            await Follower.save()

            res.status(204).end()
        } else {
            res.status(400).json({ error: `Couldnt remove ${Follower.firstName+' '+Follower.lastName}` })
        }
    } catch (e) {
        console.log(e)
        res.status(400).json({ error: 'Some Internal Error' })
    }
})

UserRouter.post('/following/remove', middleware.tokenExtractor, middleware.userExtractor, async (req, res, next) => {
    let user = req.user
    const { FollowingId } = req.body

    try {

        let Following = await User.findById(FollowingId)

        if (user.Following.find(f => f.toString() === FollowingId) && Following.Followers.find(f => f.toString() === user._id.toString())) {
            user.Following = user.Following.filter(f => f._id.toString() !== FollowingId)
            user.FollowingCount -= 1
            await user.save()

            Following.Followers = Following.Followers.filter(f => f._id.toString() !== user._id.toString())
            Following.FollowerCount -= 1
            await Following.save()

            res.status(204).end()
        } else {
            res.status(400).json({ error: `Couldnt unfollow ${Following.firstName+' '+Following.lastName}` })
        }
    } catch (e) {
        console.log(e)
        res.status(400).json({ error: 'Some Internal Error' })
    }
})

UserRouter.get('/subgreddits',middleware.tokenExtractor,middleware.userExtractor, async (req,res,next) => {
    let user = req.user
    const data =await User.findById(user._id,{SubGreddits: true,_id: false}).populate({
        path: 'SubGreddits',
        populate: {
            path: 'id',
            model: 'SubGreddit',
            select: {id:true , _id: true}
        },
        select: {SubGreddits: true,_id: false}
    })
    res.status(200).json(data.SubGreddits)
})

UserRouter.get('/savedposts',middleware.tokenExtractor,middleware.userExtractor, async (req,res,next) => {
    let user = req.user
    const data = await User.findById(user._id,{Saved: true}).populate({
        path: 'Saved',
        populate: [{
            path: 'Post',
            model: 'Post',
        },{
            path: 'SubGreddit',
            model: 'SubGreddit',
            select: {Name: true,_id: true}
        }],
    })
    res.status(200).json(data.Saved)
})

UserRouter.delete('/savedposts/:id',middleware.tokenExtractor,middleware.userExtractor, async (req,res,next) => {
    let user = req.user
    let PostId = req.params.id

    if(!user.Saved.find(p => p._id.toString() === PostId)){
        return  res.status(400).json({error: 'You did not save this Post!'})
    }

    user.Saved = user.Saved.filter(p => p._id.toString() !== PostId)

    await user.save()
    res.status(200).json()
})

module.exports = UserRouter