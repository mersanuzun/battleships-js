var express = require("express");
var Ship = require("./libs/Ship.js");
var Player = require("./libs/Player.js");
var Board = require("./libs/Board.js")
var app = express();
app.use(express.static('public'));
var server = require("http").createServer(app);
var io = require("socket.io").listen(server);
port = "5050";
server.listen(port);
console.log("Server is running at", port);
app.use(express.static(__dirname + '/public/'));
app.get("/", function(req, res){
    res.sendfile(__dirname + "/public/index.html");
});
var players = [];
var watcher = [];
var hasTurn = 0;
var readyPlayersNumber = 0;
io.on('connection', function(socket){
    socket.on("player-name", function(name){
        if (players.length == 2){
            watcher.push(name);
        }else{
            socket.player = new Player(socket.id, name);
            socket.player.setBoard(new Board());
            players.push(socket.player)
        }
        io.emit("init", players);
    })
    socket.on("placeShip", function(coor){
        socket.player.board.placeShip(new Ship(coor.x, coor.y))
        console.log(socket.player)
    });
    socket.on("ready", function(){
        if (checkShipNumbers(socket.player.board) == false){
            socket.emit("non-ready")
        }else{
            readyPlayersNumber++;
            socket.emit("ready");
            if (readyPlayersNumber == 2){
                io.emit("start-game", {hasTurn: players[0].playerID});
                return
            }
            socket.broadcast.emit("opp-ready");
        }
    })
    socket.on("hit", function(data){
        console.log(findPlayer(data.oppID).board.hit(data.x, data.y))
        changeTurn();
    })
});

function findPlayer(id){
    for(var i = 0; i < players.length; i++){
        if (players[i].playerID == id) break;
    }
    return players[i];
}
function changeTurn(){
    hasTurn = hasTurn == 1 ? 0 : 1;
    io.emit("changeTurn", players[hasTurn].playerID);
}

function checkShipNumbers(board){
    if (board.shipNumber == board.ships.length) return true;
    else return false;
}