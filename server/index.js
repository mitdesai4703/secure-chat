const express = require('express'),
      app = express();
      bodyParser = require('body-parser'),
      logger = require('morgan'),
      mongoose = require('mongoose'),
      config = require('./config/main'),
      router = require('./router'),
      socketEvents = require('./socketEvents');

mongoose.connect(config.database)
    .then(() => {
      console.log('everything in place');
    })
    .catch(error => {
      console.log('oups, something went wrong');
      console.log(error);
    })

const server = app.listen(config.port);
console.log('The server is running on port ' + config.port + '.');

const io = require('socket.io').listen(server);
socketEvents(io);

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Access-Control-Allow-Headers, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
router(app);
