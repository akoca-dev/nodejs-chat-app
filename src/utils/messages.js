const generateTxtMessage = ({username, text}) => {
    return {
        username,
        text,
        sendTime: new Date().getTime()
    }
}

const generateLocationMessage = ({username, locationUrl}) => {
    return {
        username,
        locationUrl,
        sendTime: new Date().getTime()
    }
}

module.exports = {
    generateTxtMessage,
    generateLocationMessage
}