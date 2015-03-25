var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({port: 8080});
var express = require('express');
var fs= require('fs');
var app = express();
var timer_running = false;
var time = 10;
var status = 'game';
var bodyParser = require('body-parser');
var drupalUrl = 'fasndfask';
var gameData =  {};
var _ = require ('underscore');
var usersInDraw = [];
var registered = false;
var file = fs.readFileSync("./game.json", "utf8");

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.post('/validate-user', function(req, res){
  var user = req.body.email;
  console.log(req.body.email);
  res.send('4');
  res.end('end');
});

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

app.get('/start', function (req, res) {
    console.log('Start Timer');

    res.send('Timer!')
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

app.get('/add-user', function(res, req) {
  var status = _.indexOf(usersInDraw, req.body.email);

  if (status != -1) {
    console.log('Kasutaja osaleb juba loosimises');
    res.send(false);
  } else {
    usersInDraw.push(req.body.email);
    res.send(true);
  }
  console.log('body: ' + req.body.email);
});

app.post('/participating', function(req, res) {
  console.log(req.body);
  var status = _.indexOf(usersInDraw, req.body.email);
  if (status != -1) {
    res.send(true);
  } else {
    res.send(false);
  }
  res.end('end');
});

app.post('/remove-user', function(req, res){
  var index =_.indexOf(usersInDraw, req.body.email);
  delete usersInDraw[index];
  res.send(true);
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
    if(message.event == 'getData') {
      wss.broadcast(JSON.stringify({ type: 1, status: status}));
        wss.broadcast(JSON.stringify(getRelevantData()));

     /*   getRelevantData2(function(err, data) {
          if(data) {
            wss.broadcast(JSON.stringify({ type: 1, status: 'game', data: data}));
          }
        });*/

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
        timerEnded(function(err, data) {
          if(data) {
            usersInDraw = [];
            wss.broadcast(JSON.stringify({ type: 1, status: 'game', data: data}));

          }
        });

        clearInterval(i);
      }
      wss.broadcast(JSON.stringify({ type: 3, status: "draw", time: timer_running.toString()}));
    }, 1000);
  }
}

function getStatus() {
  return 'game';
}

function getRelevantData2(callback) {
  request({
    uri: drupalUrl + '/get-data',
    method: 'POST'
  }, function(err, response) {
    if (response) {
      callback(false, response);
    }
    if(err) {
      console.error('Get-data error');
      callback(true, err);
    }
  });
}

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

function timerEnded(timerCallback) {
  request({
    uri: drupalUrl + '/api/get-players',
    method: 'POST',
    json: {
      participants: usersInDraw
    }
  }, function(err, response) {
    if (response) {
      timerCallback(false, response);
    }
    if(err) {
      console.error('Get-players error');
      timerCallback(true, err);
    }
  });
}
//  app.get('/users', middleware1, middleware2, middleware3, processRequest);
