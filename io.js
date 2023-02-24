const Chat = require("./models/Chat")
const { VerifyFollow } = require("./utils/ChatHelpers")
const { getUserId } = require('./utils/ChatHelpers')

var Connections = new Set()

const IoFunction = async (socket) => {
    const ChatWith = socket.handshake.query.ChatWith
    const check = await VerifyFollow(socket.handshake.query.token,socket.handshake.query.ChatWith)
    const userId = await getUserId(socket.handshake.query.token)
    if(check !== true){
        socket.emit('client_disconnect',check)
    }else{
        const RoomId = ChatWith < userId ? ChatWith + userId : userId + ChatWith
        socket.emit('load_history',await Chat.find({Room: RoomId}))
        socket.join(RoomId)
        socket.on('send',async (message) => {
            socket.broadcast.to(RoomId).emit('receive',message)
            const newChat = new Chat({
                mesg: message,
                time: new Date(),
                By: userId,
                Room: RoomId
            })
            await newChat.save()
        })
    }
    socket.on('disconnect',() => {
        console.log("Client disconnected")
    })
}

module.exports = IoFunction