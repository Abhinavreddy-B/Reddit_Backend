const express = require('express');
const Post = require('../models/Posts');
const SubGreddit = require('../models/SubGreddit')
const User = require('../models/user');
const SubGredditRouter = express.Router()

SubGredditRouter.get('/all', async (req, res, next) => {
    return res.status(200).json(await SubGreddit.find({}))
})

SubGredditRouter.get('/', async (req, res, next) => {
    const user = req.user
    return res.status(200).json(await SubGreddit.find({ Owner: user._id }))
})

SubGredditRouter.post('/', async (req, res, next) => {
    const { Name, Description, Tags, Banned } = req.body
    const user = req.user

    const newSubGreddit = new SubGreddit({
        Name,
        Description,
        Tags,
        Banned,
        PeopleCount: 1,
        PostsCount: 0,
        Owner: user._id,
        CreatedAt: new Date(),
        People: [],
        Requests: []
    })

    try {

        const response = await newSubGreddit.save()

        user.SubGreddits.push({ id: response._id, role: 'mod' })

        await user.save()

        res.status(200).json(response)
    } catch (e) {
        console.log(e)
        return res.status(500).end()
    }

})

SubGredditRouter.delete('/:id', async (req, res, next) => {
    let user = req.user
    const id = req.params.id
    try {
        console.log("deleteing", req.params.id)
        const found = await SubGreddit.findById(id)
        // console.log(found.Owner.toString())
        if (found.Owner.toString() !== user._id.toString()) {
            return res.status(401).json({ error: 'You are not allowed to delete this' })
        }

        user.SubGreddits = user.SubGreddits.filter(f => f.id.toString() !== id)


        await user.save()
        await SubGreddit.findByIdAndDelete(id)
        await Post.deleteMany({ PostedIn: id })

        res.status(204).end()

    } catch (e) {
        console.log(e)
        return res.status(400).json({ error: 'Malformed Id' })
    }
})

SubGredditRouter.delete('/leave/:id', async (req, res, next) => {
    const user = req.user
    const id = req.params.id

    if (!user.SubGreddits.find(f => f.id.toString() === id)) {
        return res.status(400).json({ error: 'You are not In the SubGreddit' })
    } else if (user.SubGreddits.find(f => f.id.toString() === id).role === 'mod') {
        return res.status(400).json({ erro: 'You Are a Moderator. You cant leave' })
    }
    user.SubGreddits = user.SubGreddits.map(f => f.id.toString() !== id ? f : { ...f, role: 'left' })
    await user.save()
    return res.status(200).end()
})

SubGredditRouter.get('/:id', async (req, res, next) => {
    const user = req.user
    const id = req.params.id

    // If user is not a participant
    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role !== 'left')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const found = await SubGreddit.findById(id).populate({
        path: 'Posts',
        model: Post,
    })
    res.status(200).json(found)
})

SubGredditRouter.get('/:id/users', async (req, res, next) => {
    const user = req.user
    const id = req.params.id

    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    try {
        const data = await SubGreddit.findById(id, { People: true }).populate({
            path: 'People',
            populate: {
                path: 'ref',
                model: 'User',
                select: { firstName: true, lastName: true, _id: true }
            },
            select: { ref: true, blocked: true, _id: false }
        })

        console.log(data.People)
        return res.status(200).json(data.People)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: 'Some Internal error' })
    }
})

SubGredditRouter.get('/:id/join', async (req, res, next) => {
    const user = req.user
    const id = req.params.id

    if (user.SubGreddits.find(f => f.id.toString() === id && f.role === 'left')) {
        return res.status(400).json({ error: 'Once you have left, You cant join back!' })
    } else if (user.SubGreddits.find(f => f.id.toString() === id)) {
        return res.status(400).json({ error: 'You are already a member' })
    }

    const found = await SubGreddit.findById(id)

    if (found === null) {
        return res.status(400).json({ error: 'SubGreddit does not exist' })
    }

    if (found.Requests.find(f => f.toString() === user._id.toString())) {
        return res.status(400).json({ error: 'You have previously sent join request already' })
    }

    found.Requests.push(user._id)

    try {
        await found.save()

        return res.status(200).end()
    } catch (e) {
        return res.status(500).json({ error: 'Some internal error' })
    }
})

SubGredditRouter.get('/:id/requests', async (req, res, next) => {
    const user = req.user
    const id = req.params.id

    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    try {
        const data = await SubGreddit.findById(id, { Requests: true }).populate({
            path: 'Requests',
            model: 'User',
            select: { firstName: true, lastName: true, _id: true }
        })

        console.log(data.Requests)
        res.status(200).json(data.Requests)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: 'Some internal error' })
    }
})

SubGredditRouter.post('/accept', async (req, res, next) => {
    const { SubGredditId, userId } = req.body
    const user = req.user

    console.log(user)
    if (!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const newUser = await User.findById(userId)
    if (newUser === null) {
        return res.status(400).json({ error: 'User does not exist' })
    }

    const foundSubGreddit = await SubGreddit.findById(SubGredditId)
    if (foundSubGreddit === null) {
        return res.status(400).json({ error: 'SubGreddit does not exist' })
    }

    // If request was not found
    if(!foundSubGreddit.Requests.find(f => f.toString() === userId)){
        return res.status(400).json({error: 'User did not request for joining'})
    }

    newUser.SubGreddits.push({
        id: SubGredditId,
        role: 'joined'
    })

    foundSubGreddit.Requests = foundSubGreddit.Requests.filter(f => f.toString() !== userId)
    foundSubGreddit.People.push({
        ref: userId,
        blocked: false
    })
    foundSubGreddit.PeopleCount+=1

    try{
        await newUser.save()
        await foundSubGreddit.save()
        return res.status(200).json({Name: newUser.firstName+' '+newUser.lastName,id: newUser._id.toString()})
    }catch(e){
        console.log(e)
        return res.status(500).json({ error: 'Some internal error' })
    }
})

SubGredditRouter.post('/reject', async (req, res, next) => {
    const { SubGredditId, userId } = req.body
    const user = req.user

    console.log(user)
    if (!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const newUser = await User.findById(userId)
    if (newUser === null) {
        return res.status(400).json({ error: 'User does not exist' })
    }

    const foundSubGreddit = await SubGreddit.findById(SubGredditId)
    if (foundSubGreddit === null) {
        return res.status(400).json({ error: 'SubGreddit does not exist' })
    }

    // If request was not found
    if(!foundSubGreddit.Requests.find(f => f.toString() === userId)){
        return res.status(400).json({error: 'User did not request for joining'})
    }

    foundSubGreddit.Requests = foundSubGreddit.Requests.filter(f => f.toString() !== userId)

    try{
        await foundSubGreddit.save()
        return res.status(200).json({Name: newUser.firstName+' '+newUser.lastName,id: newUser._id.toString()})
    }catch(e){
        console.log(e)
        return res.status(500).json({ error: 'Some internal error' })
    }
})

module.exports = SubGredditRouter