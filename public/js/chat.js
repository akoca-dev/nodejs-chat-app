const socket = io()

// Elements
const $messageForm = document.querySelector('#sendMessageForm')
const $messageTxtInput = $messageForm.querySelector('#messageTxtInput')
const $sendMessageButton = $messageForm.querySelector('#sendMessageBtn')
const $sendLocationButton = document.querySelector('#sendLocationBtn')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#messageTemplate').innerHTML
const sharedLocationTemplate = document.querySelector('#sharedLocationTemplate').innerHTML
const sidebarTemplate = document.querySelector('#sidebarTemplate').innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMarginBottom = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMarginBottom

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset =$messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const formattedSendTime = moment(message.sendTime).format('HH:mm')
    console.log(`${formattedSendTime} - "${message.text}"`)

    const messageHtml = Mustache.render(messageTemplate, {
        sender: message.username,
        messageTxt: message.text,
        sendTime: formattedSendTime
    })
    $messages.insertAdjacentHTML('beforeend', messageHtml)
    autoscroll()
})

socket.on('locationMessage', (locationMessage) => {
    const formattedSendTime = moment(locationMessage.sendTime).format('HH:mm')
    console.log(`${formattedSendTime} - ${locationMessage.locationUrl}`)

    const locationLinkHtml = Mustache.render(sharedLocationTemplate, {
        sender: locationMessage.username,
        sharedUserLocation: locationMessage.locationUrl,
        sendTime: formattedSendTime
    })

    $messages.insertAdjacentHTML('beforeend', locationLinkHtml)
    autoscroll()
})

socket.on('roomData', ({ room:roomName, users }) => {
    const sideBarHtml = Mustache.render(sidebarTemplate, {
        roomName,
        users
    })

    document.querySelector('#chatSidebar').innerHTML = sideBarHtml
})

$messageForm
    .addEventListener('submit', (e) => {
        e.preventDefault()
        $sendMessageButton.setAttribute('disabled', 'disabled')
        console.log('Clicked')

        const messageTxt = $messageTxtInput.value
        socket.emit('sendMessage', messageTxt, (acknowledgeResponse) => {
            $sendMessageButton.removeAttribute('disabled')
            $messageTxtInput.value = ''
            $messageTxtInput.focus()
            console.log(
                acknowledgeResponse.error
                    ? `Server acknowledge error: ${acknowledgeResponse.error}`
                    : `Server acknowledge success: ${acknowledgeResponse.deliveryOkMessage}`
            )
        })
    })

$sendLocationButton
    .addEventListener('click', () => {
        $sendLocationButton.setAttribute('disabled', 'disabled')
        if (!navigator.geolocation) {
            return alert('Geolocation not suppoerted')
        }

        navigator.geolocation.getCurrentPosition((position) => {
            socket.emit('sendLocation', {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }, (acknowledgeResponse) => {
                $sendLocationButton.removeAttribute('disabled')
                console.log(` ${acknowledgeResponse.deliveryOkMessage}`)
            })
        })
    })

socket.emit('join', {username, room}, (joinResponse) => {

    if(joinResponse.error) {
        alert(joinResponse.error)
        location.href = '/'
    }

    console.log(`Join acknowledge success: ${joinResponse.joinOkMessage}`)
})