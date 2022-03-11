const users = []

const addUser = ({id, username, room}) => {
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    if(!username || !room) {
        return {
            error: 'Username and room required'
        }
    }

    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    if(existingUser) {
        return {
            error: `Username ${username} in use`
        }
    }

    const newUser = {id, username, room}
    users.push(newUser)

    return { user: newUser }
}

const removeUser = (userId) => {
    const index = users.findIndex((user) => user.id === userId)

    if(index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (userId) => {
    return users.find((user) => user.id === userId)
}

const getUsersInRoom = (roomName) => {
    return  users.filter((user) => user.room === roomName)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}