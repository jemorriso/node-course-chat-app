// instead of writing out the object everytime we need to use it, use this function
const generateMessage = (username, text) => {
    return {
        username,
        text, 
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}