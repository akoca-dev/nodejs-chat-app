const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateTxtMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

io.on('connection', (socket) => {
    console.log('New websocket connection')

    socket.on('join', (options, acknowledge) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if(error) {
            console.log(error)
            return acknowledge({ error: `Room join failed: ${error}` })
        }

        socket.join(user.room)

        socket.emit('message', generateTxtMessage({
            username: 'Admin',
            text: "Welcome"
        }))

        socket.broadcast.to(user.room).emit('message', generateTxtMessage({
            username: 'Admin',
            text: `${user.username} has joined the room`
        }))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        acknowledge({ joinOkMessage: `${user.username} joined to ${user.room} successfully` })
    })

    socket.on('sendMessage', (message, acknowledge) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return acknowledge({
                error: 'Profanity not allowed'
            })
        }

        io.to(user.room).emit('message', generateTxtMessage({
            username: user.username,
            text: message
        }))
        acknowledge({
            deliveryOkMessage: 'Delivery ok'
        })
    })

    socket.on('sendLocation', (coordinates, acknowledge) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage({
            username: user.username,
            locationUrl: `https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
        }))
        acknowledge({
            deliveryOkMessage: 'Send Location successful'
        })
    })

    socket.on('disconnect', () => {
        const removedUser = removeUser(socket.id)

        if(removedUser) {
            io.to(removedUser.room).emit('message', generateTxtMessage({
                username: 'Admin',
                text: `User ${removedUser.username} left ${removedUser.room} room`
            }))

            io.to(removedUser.room).emit('roomData', {
                room: removedUser.room,
                users: getUsersInRoom(removedUser.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Server listening on: ${port}`)
})