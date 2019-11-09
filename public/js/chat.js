const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

// template html that gets rendered by Mustache
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
    // Parses query string into object 
    //location.search is the URL QUERY STRING. Not anything to do with 'location' in this app
    // ignoreQueryPrefix removes the '?' from the beginning of the string
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// autoscroll if user is looking at most recent messages
    // don't autoscroll if user is looking at old messages
const autoscroll = () => {
    const $newMessage = $messages.lastElementChild;

    // getComputedStyle returns all the styling that has been applied to the element on the page
        // offsetHeight is just the height of the element without the margin
        // need to add marginBottom so that accurate calculation for autoscroll can be performed (marginTop is 0px)
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    console.log(newMessageStyles);
    const visibleHeight = $messages.offsetHeight;

    // scrollHeight is entire height of element including part not on screen
    const containerHeight = $messages.scrollHeight;

    // scrollTop is how far you've scrolled from the top (to the top of the scroll bar)
         // then we add on visibleHeight which gives us the height to the bottom of the visible part of the screen
         // we need to do this because there is no scrollBottom 
    const scrollOffset = $messages.scrollTop + visibleHeight;

    // containerHeight - newMessageHeight to figure out if we were scrolled to the bottom before the new message came in
        // autoscrolls by default due to <
    if (containerHeight - newMessageHeight <= scrollOffset) {
        // auto scroll 
            // $messages.scrollTop = $messages.scrollHeight;
            // I changed instructor's code for my code because it makes more sense to add the height of the new container
            // instead of setting scrollTop to the entire container height.
            // see Mozilla docs: 'if set scrollTop greater than max available value, scrollTop settles itself back to max'
        $messages.scrollTop = scrollOffset + newMessageHeight;
    }
}

socket.on('locationMessage', (message) => {
    console.log(message);
    // render the html inside the mustache template that was selected by locationTemplate
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        locationURL: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    // and now append the rendered html to messages, which is displayed on the page
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    // the html generated is a list containing all active users, so we just replace it each time
    document.querySelector('#sidebar').innerHTML = html;
});

// callback function gets executed as event handler 
socket.on('message', (message) => {
    console.log(message);
        // changed the message to be an object so we have timestamps
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        // using moment script provided in index.html to format the timestamp
            // format eg return value: '11:59 am'
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    // insert the rendered html into the messages stream
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

document.querySelector("#message-form").addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');

    // better than using querySelector because if we add new inputs the logic will break
    const message = e.target.elements.message.value;
    //const message = document.querySelector('input').value;

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled', );
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }

        console.log('the message delivered');
    });
})
// socket.on('countUpdated', (count) => {
//     console.log("The count has been updated", count);
// });

// document.querySelector('#increment').addEventListener('click', () => {
//     console.log('Button clicked brah');
//     socket.emit('increment');
// })
 
$locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported');
    }
    $locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        const coords = {latitude: position.coords.latitude, longitude: position.coords.longitude}

        socket.emit('sendLocation', coords, () => {
            console.log("location shared!");
            $locationButton.removeAttribute('disabled');
        });
    });
});

// user has been redirected to chat.html via 'join' form
    // we need to emit join event so server can broadcast to other users
    // the object passed was created by parsing query string at top of file
socket.emit('join', { username, room }, (error) => {
   // if error send user back to homepage
    if (error) {
       alert(error);
       location.href = '/';
   } 
});
