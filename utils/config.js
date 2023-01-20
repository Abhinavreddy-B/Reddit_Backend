require('dotenv').config()

const Port = process.env.PORT || 5000
const MongoUri = process.env.MONGO_URI
const Secret = process.env.SECRET

module.exports = {Port,MongoUri,Secret}