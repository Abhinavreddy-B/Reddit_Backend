const express = require('express');
const Post = require('../models/Posts');
const Report = require('../models/Reports');
const SubGreddit = require('../models/SubGreddit')
const User = require('../models/user');
const SubGredditRouter = express.Router()
const config = require('../utils/config')
const Fuse = require('fuse.js')

// get all subgreddits
SubGredditRouter.get('/tags',async (req,res,next) => {
    const items =  await SubGreddit.find({}, { Tags: true})
    const tagArrays = items.map(e => e.Tags)
    let tags = []
    tagArrays.forEach(arr => {
        tags = [...new Set([...tags, ...arr])]
    })
    return res.status(200).json(tags)
})

SubGredditRouter.get('/all', async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const perPage = 6;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const search = req.query.search || undefined;
    const fuzzy = (req.query.fuzzy === 'true') || false;
    // console.log("tags",req.query)
    const Tags = req.query.Tags || [];
    const sort = req.query.sort || 'NameAsc';
    const user = req.user


    const NameAscCmp = (a, b) => {
        if (a.Name < b.Name) {
            return -1
        } else if (a.Name > b.Name) {
            return 1
        }
        return 0
    }
    
    const NameDescCmp = (a, b) => {
        if (a.Name > b.Name) {
            return -1
        } else if (a.Name < b.Name) {
            return 1
        }
        return 0
    }
    
    const FollowerCmp = (a, b) => {
        if (a.PeopleCount > b.PeopleCount) {
            return -1
        } else if (a.PeopleCount < b.PeopleCount) {
            return 1
        }
        return 0
    }
    
    const CreationCmp = (a, b) => {
        if (new Date(a.CreatedAt) > new Date(b.CreatedAt)) {
            return -1
        } else if (new Date(a.CreatedAt) < new Date(b.CreatedAt)) {
            return 1
        }
        return 0
    }

    items = await SubGreddit.find({}, { Name: true, Description: true, Tags: true, Banned: true, PeopleCount: true, PostsCount: true, CreatedAt: true })

    const data =await User.findById(user._id,{SubGreddits: true,_id: false}).populate({
        path: 'SubGreddits',
        populate: {
            path: 'id',
            model: 'SubGreddit',
            select: {id:true , _id: true}
        },
        select: {SubGreddits: true,_id: false}
    })
    UserSubGreddits = data.SubGreddits

    const JoinedCmp = (a, b) => {
        const f1 = UserSubGreddits.find(p => p.id.id === a.id)
        const f2 = UserSubGreddits.find(p => p.id.id === b.id)
        const e1 = f1 && f1.role !== 'left'
        const e2 = f2 && f2.role !== 'left'

        if (e1 && !e2) {
            return -1
        } else if (!e1 && e2) {
            return 1
        }
        return 0
    }
    const FuzzyCmp = (a, b) => {
        if (a.refIndex < b.refIndex) {
            return -1
        } else if (a.refIndex > b.refIndex) {
            return 1
        }
        return 0
    }

    switch (sort) {
        case 'NameAsc': {
            items.sort(NameAscCmp)
            break;
        }
        case 'NameDesc': {
            items.sort(NameDescCmp)
            break;
        }
        case 'Followers': {
            items.sort(FollowerCmp)
            break;
        }
        case 'Creation': {
            items.sort(CreationCmp)
            break;
        }
        default: {
            console.log('hello')
        }
    }

    const fuse = new Fuse(items, {
        keys: ['Name']
    })
    // console.log(items[0].Name.toLowerCase())
    // console.log(items.slice().filter(f => f.Name.toLowerCase().includes(search.toLowerCase())).map(f => {return {item: f,refIndex: 1}}))
    var FilteredData
    if(search !== undefined && search !== '' && search !== null){
        if(fuzzy === true){
            FilteredData = fuse.search(search)
        }else{
            FilteredData = items.filter(f => f.Name.toLowerCase().includes(search.toLowerCase())).map(f => {return {item: f,refIndex: 1}})
        }
    }else{
        FilteredData = items.map(f => { return { item: f, refIndex: 1 } })
    }
    // const FilteredData = (search !== undefined && search !== '' && search !== null) ? (fuzzy? fuse.search(search) : items.filter(f => f.Name.toLowerCase().includes(search.toLowerCase())).map(f => {return {item: f,refIndex: 1}})) : items.map(f => { return { item: f, refIndex: 1 } })
    
    // console.log(items[0].Name)
    const TagFiltered = FilteredData ? (Tags.length > 0 ? FilteredData.filter(fdat => {
        for (let i = 0; i < Tags.length; i++) {
            if (fdat.item.Tags.find(val => val === Tags[i])) {
                return true;
            }
        }
        return false;
    }) : FilteredData) : []

    const FuzzyData = TagFiltered.slice().sort(FuzzyCmp).map(f => f.item)
    const SortedData = UserSubGreddits ? FuzzyData.slice().sort(JoinedCmp) : TagFiltered.slice()

    const ToSend = SortedData

    // console.log("sending", ToSend)
    const paginatedItems = ToSend.slice(startIndex, endIndex);
    return res.status(200).json({
        items: paginatedItems,
        totalPages: Math.ceil(ToSend.length / perPage)
    })
})

// GET subgreddits owned by a user
SubGredditRouter.get('/', async (req, res, next) => {
    const user = req.user
    return res.status(200).json(await SubGreddit.find({ Owner: user._id }, { Name: true, Description: true, Tags: true, Banned: true, PeopleCount: true, PostsCount: true, CreatedAt: true }))
})


const PostsRouter = express.Router()
const ImageKit = require("imagekit");
const Comment = require('../models/Comments');


const imageKit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
})

SubGredditRouter.post('/', async (req, res, next) => {
    const { Name, Description, Tags: UnParsedTags, Banned: UnParsedBanned } = req.body
    const Tags = JSON.parse(UnParsedTags)
    const Banned = JSON.parse(UnParsedBanned)
    const user = req.user
    const file = req.files ? req.files.image : null
    // console.log(file)
    const up = file ? await imageKit.upload({
        file: file.data,
        fileName: file.name
    }): null
    // console.log(up)

    const newSubGreddit = new SubGreddit({
        ImageUrl: up ? up.url : undefined,
        Name,
        Description,
        Tags: Tags || [],
        Banned: Banned || [],
        PeopleCount: 1,
        PostsCount: 0,
        Owner: user._id,
        CreatedAt: new Date(),
        People: [],
        Requests: [],
        Rejected: [],
        Reports: [],
        GrowthStat: [{
            date: new Date(),
            delta: 1
        }],
        PostsVsDateStat: [],
        VisitStat: [],
        ReportsVsDel: [],
        totalReportedCnt: 0,
        totalDeletedCount: 0,
    })

    try {

        const response = await newSubGreddit.save()

        user.SubGreddits.push({ id: response._id, role: 'mod' })

        await user.save()

        res.status(200).json(response)
    } catch (e) {
        console.log(e)
        next(e)
    }

})

SubGredditRouter.delete('/:id', async (req, res, next) => {
    let user = req.user
    const id = req.params.id
    try {
        const found = await SubGreddit.findById(id)
        // console.log(found.Owner.toString())
        if (found === null) {
            return res.status(404).json({ error: 'SubGreddit not found' })
        }
        if (found.Owner.toString() !== user._id.toString()) {
            return res.status(401).json({ error: 'You are not allowed to delete this' })
        }

        // user.SubGreddits = user.SubGreddits.filter(f => f.id.toString() !== id)


        // await user.save()
        await User.updateMany({ SubGreddits: { $elemMatch: { id: id } } }, { $pull: { SubGreddits: { id } } })
        await User.updateMany({ Saved: { $elemMatch: { SubGreddit: id } } }, { $pull: { Saved: { SubGreddit: id } } })
        await Report.deleteMany({ SubGreddit: id })
        await Post.deleteMany({ PostedIn: id })
        await SubGreddit.findByIdAndDelete(id)

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
    await SubGreddit.findByIdAndUpdate(id, { $inc: { PeopleCount: -1 }, $pull: { People: { ref: user._id } }, $push: { GrowthStat: { date: new Date(), delta: -1 } } })
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

    const found = await SubGreddit.findById(id)

    // console.log("Hello")
    found.VisitStat.push({ date: new Date(), delta: 1 })

    await found.save()
    var newData = await SubGreddit.findById(id, { ImageUrl: true, Name: true, Description: true, Tags: true, Banned: true, PeopleCount: true, PostsCount: true, Owner: true, CreatedAt: true, Posts: true, _id: true }).populate({
        path: 'Posts',
        model: Post,
        populate: {
            path: 'Comments',
            model: Comment,
            select: {Text: true}
        }
    })

    // console.log({...newData.Posts[0]})'
    var temp = JSON.parse(JSON.stringify(newData.Posts))
    temp = temp.map(f => {
        if(f.UpvoteList && f.UpvoteList.find(u => u.toString() === user._id.toString())){
            return {...f,Upvoted: true}
        }else{
            return {...f,Upvoted: false}
        }
    })
    temp = temp.map(f => {
        if(f.DownvoteList && f.DownvoteList.find(u => u.toString() === user._id.toString())){
            return {...f,Downvoted: true}
        }else{
            return {...f,Downvoted: false}
        }
    })
    
    temp = temp.map(f => {
        return {
            Text: f.Text,
            PostedBy: f.PostedBy,
            PostedIn: f.PostedIn,
            Upvotes: f.Upvotes,
            Downvotes: f.Downvotes,
            Comments: f.Comments,
            Upvoted: f.Upvoted,
            Downvoted: f.Downvoted,
            id: f.id
        }
    })
    // console.log(temp)
    // console.log(newData.Posts)
    newData = newData.toObject()
    newData.id = newData._id.toString()
    newData.Posts = temp
    // console.log(newData)
    res.status(200).json(
        newData
    )
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

    if(found.People.find(f => f.ref.toString() === user._id.toString() && f.blocked === true)){
        return res.status(400).json({error: 'You have been blocked, You cant join'})
    }
    if (found.Requests.find(f => f.toString() === user._id.toString())) {
        return res.status(400).json({ error: 'You have previously sent join request already' })
    }

    found.Rejected = found.Rejected ? found.Rejected.filter(f => new Date().getTime() - f.date.getTime() <= (config.RejectTimeout)) : []
    if (found.Rejected.find(f => f.user.toString() === user._id.toString())) {
        return res.status(400).json({ error: 'Since Moderator rejected your request, you have to wait for 7 days to request again' })
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

        res.status(200).json(data.Requests)
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: 'Some internal error' })
    }
})

SubGredditRouter.post('/accept', async (req, res, next) => {
    const { SubGredditId, userId } = req.body
    const user = req.user

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
    if (!foundSubGreddit.Requests.find(f => f.toString() === userId)) {
        return res.status(400).json({ error: 'User did not request for joining' })
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
    foundSubGreddit.PeopleCount += 1
    // if(foundSubGreddit.GrowthStat.find(day => today.getFullYear() === day.getFullYear() && today.getMonth() === day.getMonth() && today.getDate() === day.getDate())){
    //     foundSubGreddit.GrowthStat.map(day => (today.getFullYear() === day.getFullYear() && today.getMonth() === day.getMonth() && today.getDate() === day.getDate())?{...day,count: day.count+1}:day)
    // }else{
    //     foundSubGreddit.GrowthStat.push({
    //         date: new Date(),
    //         count: 
    //     })
    // }
    foundSubGreddit.GrowthStat.push({
        date: new Date(),
        delta: 1
    })

    try {
        await newUser.save()
        await foundSubGreddit.save()
        return res.status(200).json({ Name: newUser.firstName + ' ' + newUser.lastName, id: newUser._id.toString() })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: 'Some internal error' })
    }
})

SubGredditRouter.post('/reject', async (req, res, next) => {
    const { SubGredditId, userId } = req.body
    const user = req.user

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
    if (!foundSubGreddit.Requests.find(f => f.toString() === userId)) {
        return res.status(400).json({ error: 'User did not request for joining' })
    }

    if (foundSubGreddit.Rejected) {
        foundSubGreddit.Rejected.push({ date: new Date(), user: newUser._id })
    } else {
        foundSubGreddit.Rejected = [{ date: new Date(), user: newUser._id }]
    }
    foundSubGreddit.Requests = foundSubGreddit.Requests.filter(f => f.toString() !== userId)

    try {
        await foundSubGreddit.save()
        return res.status(200).json({ Name: newUser.firstName + ' ' + newUser.lastName, id: newUser._id.toString() })
    } catch (e) {
        console.log(e)
        return res.status(500).json({ error: 'Some internal error' })
    }
})

SubGredditRouter.get('/:id/reports', async (req, res, next) => {
    const user = req.user
    const SubGredditId = req.params.id

    if (!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const reports = await SubGreddit.findById(SubGredditId).populate({
        path: 'Reports',
        model: 'Report',
        populate: [{
            path: 'ReportedBy',
            model: 'User',
            select: { firstName: true, lastName: true, _id: true }
        }, {
            path: 'Post',
            model: 'Post',
            select: { PostedBy: true, Text: true, _id: true }
        }, {
            path: 'ReportedOn',
            model: 'User',
            select: { userName: true, firstName: true, lastName: true, _id: true }
        }]
    })

    // found.Rejected.filter(f => new Date().getTime() - f.date.getTime() <= (config.RejectTimeout))
    reports.Reports = reports.Reports.filter(f => new Date().getTime() - f.ReportedAt.getTime() <= config.ReportTimeout)

    await reports.save()
    res.status(200).json(reports.Reports)
})

module.exports = SubGredditRouter