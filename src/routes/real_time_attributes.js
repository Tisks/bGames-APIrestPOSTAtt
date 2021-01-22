
const { response } = require("express");
const express = require("express");
const real_time_attributes = express.Router();
const {mysqlConnection} = require('../database');

let users = [];
let messages = [];
let index = 0

module.exports = (io) => {
    console.log('IO: ', io);
    io.on('connection', socket => {
        socket.emit('loggedIn', {
            users: users.map(s => s.username),
            messages: messages
        });
    
        socket.on('newuser', username => {
            console.log(`${username} has arrived at the party.`);
            socket.username = username;
            
            users.push(socket);
    
            io.emit('userOnline', socket.username);
        });
    
        socket.on('msg', msg => {
            let message = {
                username: socket.username,
                msg: msg,
                index:index
            }
            messages.push(message);
    
            io.emit('msg', message);
            index++
        });
        
        // Disconnect
        socket.on("disconnect", () => {
            console.log(`${socket.username} has left the party.`);
            io.emit("userLeft", socket.username);
            users.splice(users.indexOf(socket), 1);
        });

    });

    // put any other code that wants to use the io variable
    // in here

    real_time_attributes.put('/player_attributes',(req,res)=>{
        console.log(req.body)
        let id_player = req.body.id_player;
        let id_attributes = req.body.id_attributes;
        let new_data = req.body.new_data
    
        let date = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
        let update = 'UPDATE `playerss_attributes` '
        let set = ' SET `data` = ?,`last_modified` = ' + '\''+date+'\'' 
        let where = ' WHERE `playerss_attributes`.`id_playerss` = ? '
        let and = 'AND `playerss_attributes`.`id_attributes` = ? '
        let query = update+set+where+and
        console.log(id_player)
        console.log(id_attributes)
        console.log(new_data)
    
        console.log(query)
        mysqlConnection.getConnection(function(err,connection){
            if (err) {
              callback(false);
              return;
            }
            for(let i = 0; i< id_attributes.length; i++){
                connection.query(query,[new_data[i], id_player,id_attributes[i]],function(err,rows){
                    if(!err) {
                        io.emit('player_attribute', {data: new_data[i],attributes: id_attributes[i]})                
                    }
                });
                connection.on('error', function(err) {
                        io.emit('player_attribute_error', {data: new_data[i],attributes: id_attributes[i]})          
                        return;
                });
    
    
            }
            connection.release();
    
            
            console.log('Antes del succes');
            res.status(200).json({message:'Success'});
           
        });
    })

};


