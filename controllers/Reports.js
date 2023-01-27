const express = require('express')
const Post = require('../models/Posts')
const Report = require('../models/Reports')
const SubGreddit = require('../models/SubGreddit')
const User = require('../models/user')

const ReportsRouter = express.Router()

ReportsRouter.post('/',async (req,res,next) => {
    const user = req.user
    
    const {Concern,PostId} = req.body

    const found = await Post.findById(PostId).populate('PostedIn',{_id: true,Name: true,Owner: true}) 
    const SubGredditId = found.PostedIn._id.toString()

    if(!user.SubGreddits.find(s => s.id.toString() === SubGredditId && (s.role==='mod' || s.role === 'joined'))){
        return res.status(401).json({error: 'You do not belong to the corresponding subgreddit'})
    }

    const previous = await Report.find({ReportedBy: user._id,Post: found._id})

    if(previous.length >= 1){
        return res.status(400).json({error: 'you have already reported this post!'})
    }

    newReport = new Report({
        ReportedBy: user._id,
        ReportedTo: found.PostedIn.Owner,
        Concern,
        Post: found._id,
        ReportedOn: found.PostedBy.id,
        ReportedAt: new Date()
    })

    // console.log(newReport)
    // const owner = await User.findById(found.PostedIn.Owner)
    const In = await SubGreddit.findById(found.PostedIn)

    const saved = await newReport.save()
    In.Reports = In.Reports ? [...In.Reports,saved._id] : [saved._id]

    await In.save()

    res.status(201).end()
})

ReportsRouter.get('/:id/ignore',async (req,res,next) => {
    const user = req.user

    const reportId = req.params.id
    const report = await Report.findById(reportId).populate({
        path: 'Post',
        model: 'Post',
        select: {_id: true,PostedIn: true}
    })

    if(report === null){
        return res.status(400).json({error: 'report does not exist'})
    }
    const SubGredditId = report.Post.PostedIn.toString()

    if(!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')){
        return res.status(401).json({error: 'You are not allowed to do this'})
    }

    // const foundSubGreddit = await SubGreddit.findById(SubGredditId)
    
    // foundSubGreddit.Reports = foundSubGreddit.Reports.filter(f => f.toString() !== reportId)

    // Report.findByIdAndDelete(reportId)
    report.Ignored = true

    await report.save()

    return res.status(200).end()
})

ReportsRouter.get('/:id/block',async (req,res,next) => {
    const user = req.user

    const reportId = req.params.id
    const report = await Report.findById(reportId).populate({
        path: 'Post',
        model: 'Post',
        select: {_id: true,PostedIn: true}
    })

    if(report === null){
        return res.status(400).json({error: 'report does not exist'})
    }
    if(report.Ignored === true){
        return res.status(400).json({error: 'You cant do this action since you ignored the report'})
    }
    const SubGredditId = report.Post.PostedIn.toString()

    if(!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')){
        return res.status(401).json({error: 'You are not allowed to do this'})
    }

    const post = await Post.findById(report.Post._id)

    post.PostedBy.Name = 'Blocked User'
    // const foundSubGreddit = await SubGreddit.findById(SubGredditId)
    
    // foundSubGreddit.Reports = foundSubGreddit.Reports.filter(f => f.toString() !== reportId)

    // Report.findByIdAndDelete(reportId)

    await post.save()

    return res.status(200).end()
})

ReportsRouter.get('/:id/delete',async (req,res,next) => {
    const user = req.user

    const reportId = req.params.id
    const report = await Report.findById(reportId).populate({
        path: 'Post',
        model: 'Post',
        select: {_id: true,PostedIn: true}
    })

    if(report === null){
        return res.status(400).json({error: 'report does not exist'})
    }
    if(report.Ignored === true){
        return res.status(400).json({error: 'You cant do this action since you ignored the report'})
    }
    const SubGredditId = report.Post.PostedIn.toString()

    if(!user.SubGreddits.find(f => f.id.toString() === SubGredditId && f.role === 'mod')){
        return res.status(401).json({error: 'You are not allowed to do this'})
    }

    const post = await Post.findById(report.Post._id)

    const foundSubGreddit = await SubGreddit.findById(SubGredditId)


    foundSubGreddit.Posts = foundSubGreddit.Posts.filter(f => f.toString() !== post._id.toString())
    // foundSubGreddit.Reports = foundSubGreddit.Reports.filter(f => f.toString() !== reportId)
    foundSubGreddit.PostsCount = foundSubGreddit.Posts.length
    // Report.findByIdAndDelete(reportId)

    await foundSubGreddit.save()
    await Post.findByIdAndDelete(post._id)
    await Report.deleteMany({Post: post._id})

    return res.status(200).end()
})

module.exports = ReportsRouter