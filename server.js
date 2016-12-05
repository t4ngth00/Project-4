  // set up ======================================================================
  var express  = require('express');
  var app      = express();
  var http = require('http').Server(app);
  var io = require('socket.io')(http);
  var _ = require('lodash');

  var port     = process.env.PORT || 3000;
  var mongoose = require('mongoose');
  var passport = require('passport');
  var flash    = require('connect-flash');

  var morgan       = require('morgan');
  var cookieParser = require('cookie-parser');
  var bodyParser   = require('body-parser');
  var session      = require('express-session');

  var configDB = require('./config/database.js');

  // configuration ===============================================================
  mongoose.connect(configDB.url); // connect to our database

  require('./config/passport')(passport); // pass passport for configuration

  // set up our express application
  app.use(morgan('dev')); // log every request to the console
  app.use(cookieParser()); // read cookies (needed for auth)
  app.use(bodyParser.json()); // get information from html forms
  app.use(bodyParser.urlencoded({ extended: true }));

  app.set('view engine', 'ejs'); // set up ejs for templating
  app.use(express.static(__dirname + '/views'));
  // required for passport
  app.use(session({
      secret: 'lovemelikeyoudo', // session secret
      resave: true,
      saveUninitialized: true
  }));
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
  app.use(flash()); // use connect-flash for flash messages stored in session

  // routes ======================================================================
  require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
  var users = [];
  //generate io connection
  io.on('connection', function(socket){
    console.log("user connected");

    socket.on('login', function(userData){
      users.push({'id': userData.id, 'socket': socket.id});
      console.log(users);
    })
    //sendData, for message, call, whatever
    socket.on('sendData', function(data){
      var peer_id = data.peer_id;
      //should find the user there
      var peer = _.find(users, {'id' : peer_id });
      if(!peer){
        return;
      }
      io.to(peer.socket).emit('dataReceived', data);
    });

    socket.on('disconnect', function(){
      //remove the user from the connection
      console.log('user disconnected');
    });
  })

  // launch ======================================================================
  http.listen(port, function(){
    console.log('Video call application is running on port: ' + port);
  });