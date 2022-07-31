const { Server } = require('socket.io');
require('dotenv').config({path: '.env'});

const io = new Server({ 
    cors: {
        origin: process.env.CLIENT_URL
    }
 });

let onlineUsers = [];

const addNewUser = (username, socketId, room) => {
    //some() comprueba si al menos un elemento del array cumple con la condición implementada por la función proporcionada
    !onlineUsers.some((user) => user.username == username) &&
    onlineUsers.push({username, socketId, room});
    console.log(onlineUsers)
}

const removeUser = (socketId) => {
    //filter() crea un nuevo array con todos los elementos que cumplan la condición implementada por la función dada.
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
}

const getUser = (username) => {
    return onlineUsers.find((user) => user.username === username);
}

io.on("connection", (socket) => {

    socket.on("newUser", (username, room) => {
        addNewUser(username, socket.id, room);
        const user = getUser(username);
        socket.join(user.room);
        socket.emit('join', {text: `${user.username}, welcome to room ${user.room}.`});
        socket.broadcast.to(user.room).emit('join', { text: `${user.username} has joined!` });
    }); 

    socket.on("sendNotification", ({senderName, receiverName}) => {
        const receiver = getUser(receiverName);
        io.to(receiver.socketId).emit("getNotification", {
            senderName,
        })
    });

    socket.on("sendMessage", ({senderName, text}) => {
        try {
            const user = getUser(senderName);
            io.to(user.room).emit("getMessage", {
                senderName,
                text            
            });
        } catch (error) {
            console.log(error);
        }
    });

    //socket on es para recibir
    socket.on("disconnect", () => {
        removeUser(socket.id);
    })
});

io.listen(5000);