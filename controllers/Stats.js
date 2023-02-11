const express = require('express')
const SubGreddit = require('../models/SubGreddit')
const StatsRouter = express.Router()

const AggregateBy = (str) => {
    return new Date(str).toLocaleString().split(',')[0]
}

StatsRouter.get('/:id/growth',async (req,res,next) => {
    const id = req.params.id
    const user = req.user

    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const data = await SubGreddit.findById(id)

    const daltas = data.GrowthStat
    console.log(daltas)

    const mapped = daltas.reduce((resMap, obj) => {
        const date = AggregateBy(obj.date)
        if (resMap[date] !== undefined)
          resMap[date] += obj.delta
        else
          resMap[date] = obj.delta
      
        return resMap;
      }, {})

      var array = Array.from(Object.keys(mapped));
      array = array.map(e => {return [e,mapped[e]]})
      
      const prefixArray = array.reduce((res, num) => [...res,[num[0], num[1] + (res[res.length - 1] ? res[res.length - 1][1]: 0)]], []);
      
      for(var date=data.CreatedAt;(new Date(date)) < (new Date());date.setDate(date.getDate() + 1)){
        if(!prefixArray.find( i => AggregateBy(date) === i[0])){
          var yesterday = new Date((new Date(date)).getTime() - 24*60*60*1000);
          const yestvalue = prefixArray.find( i => AggregateBy(yesterday) === i[0])
          console.log(yestvalue,prefixArray.findIndex( i => AggregateBy(yesterday) === i[0]))
          if(!yestvalue){
            prefixArray.splice(0,0,[AggregateBy(date),0])
          }else{
            prefixArray.splice(prefixArray.findIndex( i => AggregateBy(yesterday) === i[0])+1,0,[AggregateBy(date),yestvalue[1]])
          }
        }
      }
      console.log(prefixArray)
      return res.status(200).json(prefixArray)

})


StatsRouter.get('/:id/postsvsdate',async (req,res,next) => {
    const id = req.params.id
    const user = req.user

    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const data = await SubGreddit.findById(id)

    const daltas = data.PostsVsDateStat || []
    console.log(daltas)

    const mapped = daltas.reduce((resMap, obj) => {
        const date = AggregateBy(obj.date)
        if (resMap[date] !== undefined)
          resMap[date] += obj.delta
        else
          resMap[date] = obj.delta
      
        return resMap;
      }, {})

      var array = Array.from(Object.keys(mapped));
      array = array.map(e => {return [e,mapped[e]]})
      

      for(var date=data.CreatedAt;(new Date(date)) < (new Date());date.setDate(date.getDate() + 1)){
        if(!array.find( i => AggregateBy(date) === i[0])){
          var yesterday = new Date((new Date(date)).getTime() - 24*60*60*1000);
          const yestvalue = array.find( i => AggregateBy(yesterday) === i[0])
          // console.log(yestvalue,prefixArray.findIndex( i => AggregateBy(yesterday) === i[0]))
          if(!yestvalue){
            array.splice(0,0,[AggregateBy(date),0])
          }else{
            array.splice(array.findIndex( i => AggregateBy(yesterday) === i[0])+1,0,[AggregateBy(date),0])
          }
        }
      }
      console.log("Hi")
      return res.status(200).json(array)

})

StatsRouter.get('/:id/visitorsvsdate',async (req,res,next) => {
    const id = req.params.id
    const user = req.user

    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const data = await SubGreddit.findById(id)

    const daltas = data.VisitStat || []
    console.log(daltas)

    const mapped = daltas.reduce((resMap, obj) => {
        const date = AggregateBy(obj.date)
        if (resMap[date] !== undefined)
          resMap[date] += obj.delta
        else
          resMap[date] = obj.delta
      
        return resMap;
      }, {})

      var array = Array.from(Object.keys(mapped));
      array = array.map(e => {return [e,mapped[e]]})
      
      for(var date=data.CreatedAt;(new Date(date)) < (new Date());date.setDate(date.getDate() + 1)){
        if(!array.find( i => AggregateBy(date) === i[0])){
          var yesterday = new Date((new Date(date)).getTime() - 24*60*60*1000);
          const yestvalue = array.find( i => AggregateBy(yesterday) === i[0])
          // console.log(yestvalue,prefixArray.findIndex( i => AggregateBy(yesterday) === i[0]))
          if(!yestvalue){
            array.splice(0,0,[AggregateBy(date),0])
          }else{
            array.splice(array.findIndex( i => AggregateBy(yesterday) === i[0])+1,0,[AggregateBy(date),0])
          }
        }
      }
      console.log("Hi")
      return res.status(200).json(array)

})

StatsRouter.get('/:id/reportedvsdeleted',async (req,res,next) => {
    const id = req.params.id
    const user = req.user

    if (!user.SubGreddits.find(f => f.id.toString() === id && f.role === 'mod')) {
        return res.status(401).json({ error: 'You cant access this' })
    }

    const data = await SubGreddit.findById(id)

    const daltas = data.ReportsVsDel || []
    console.log(daltas)

    const mapped = daltas.reduce((resMap, obj) => {
        const cnt = obj.reported
        if (resMap[cnt] !== undefined)
          resMap[cnt] += obj.deletedDelta
        else
          resMap[cnt] = obj.deletedDelta
      
        return resMap;
      }, {})

      var array = Array.from(Object.keys(mapped));
      array = array.map(e => {return [e,mapped[e]]})
    
      const prefixArray = array.reduce((res, num) => [...res,[num[0], num[1] + (res[res.length - 1] ? res[res.length - 1][1]: 0)]], []);
      return res.status(200).json(prefixArray)

})

module.exports = StatsRouter