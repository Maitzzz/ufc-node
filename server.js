var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});
var express = require('express');
var fs= require('fs');
var app = express();
var timer_running = false;
var time = 10;
var status = 'game';
var drupalUrl = 'fasndfask';
var gameData =  {};
var usersInDraw = [];
var file = fs.readFileSync("./game.json", "utf8");

app.post('/addgoal', function (req, res) {
  var user = req.body.id;
  request({
    uri: drupalUrl + '/api/add-goal',
    method: 'POST',
    json: {
      user: user
    }
  }, function callCallback(err, response) {
    if (response) {
      gameData = response.data;
      wss.broadcast({type: 2, status:"game", data: gameData});
      updateData();

    }
  });
});

app.get('/timer', function (req, res) {
  wss.broadcast(JSON.stringify({ type: 1, status: 'draw' }));
  timer();
  res.send('Get !');
});

app.get('/draw', function (req, res) {
  status = 'draw';
  wss.broadcast(JSON.stringify({ type: 1, status: 'draw'}));
  res.send('draw')
});

app.get('/players', function (req, res) {
    status = 'players';
    wss.broadcast(JSON.stringify({ type: 1, status: 'players'}));
    res.send('players')
});

app.get('/game', function (req, res) {
  status = 'game';
  wss.broadcast(JSON.stringify({ type: 1, status: 'game'}));
  res.send('game')
});

app.get('/timer-end', function(res, req)  {
  wss.broadcast(JSON.stringify({ status: 'en'}))
});

app.get('api/add-user', function(res, req) {

});

app.get('/status', function(req, res) {
  var file2 = fs.readFileSync("./game.json", "utf8");
  wss.broadcast(JSON.stringify(file2));
  res.send('gamedata sent!')
});

var server = app.listen(8081, function () {
  var host = server.address().address;
  var port = server.address().port;
});

wss.broadcast = function broadcast(data) {
  for(var i in this.clients) {
    this.clients[i].send(data);
  }
};

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    message = JSON.parse(message);
    if(message.event == 'getStatus') {
      wss.broadcast(JSON.stringify({ type: 1, status: status}));
      //wss.broadcast(JSON.stringify({ type: 1, status: getStatus()}));
      if(getStatus() == 'game') {
        //todo check, if data exists
        //wss.broadcast(JSON.stringify(gameData));
        wss.broadcast(JSON.stringify(getRelevantData()));
      }
    }

    if(message.event == 'userData') {

    }
  });
});

function timer() {
  if (!timer_running) {
    timer_running = time;
    status = 'draw';
    var i = setInterval(function () {
      timer_running--;
      if (timer_running <= 0) {
        timer_running = false;
        wss.broadcast(JSON.stringify({type: 3, status: "draw", time: "end"}));
        setTimeout(function()  {
          status = 'game';
          wss.broadcast(JSON.stringify({type: 1, status: "game"}));
          console.log("game")
        },3000);

        clearInterval(i);
      }
      wss.broadcast(JSON.stringify({ type: 3, status: "draw", time: timer_running.toString()}));
    }, 1000);
  }
}

function getStatus() {
  return 'game';
}

/*  praticipating(function (err, ret2) {
    if (err) {
      console.log('error');
      view_error();
      return;
    }
    if (ret2) {
      view_participating();
    } else {
      view_timer();
    }
  });*/
  /*function praticipating(callback) {
    chrome.storage.local.get('email', function (data) {
      var email = data.email;

      var data = {
        'email': email
      };

      jQuery.ajax({
        type: 'POST',
        url: nodeUrl + ':3000/participating',
        data: data,
        success: function (response) {
          callback(false, response);
        },
        error: function () {
          callback(true);
        }
      });
    });
  }*/


function getRelevantData() {
  var file2 = fs.readFileSync("./game.json", "utf8");
  return JSON.parse(file2);
}

function updateData() {

  // todo how to handle different time periods in data request for game.

  request({
    uri: drupalUrl + '/api/game/current-week',
    method: 'POST',
    json: {
      participants: 'test'
    }
  }, function callCallback(err, response) {
    if (response) {
      wss.broadcast({})
    }
  });

  request({
    uri: drupalUrl + '/api/user-data',
    method: 'POST'
  }, function callCallback(err, response) {
    if (response) {
      console.log(1);
    }
  });

}


//  app.get('/users', middleware1, middleware2, middleware3, processRequest);
