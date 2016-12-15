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
  var users = {};
  var users2 = []; 


  // configuration ===============================================================
  mongoose.connect(configDB.url); // connect to our database

  var chatSchema = mongoose.Schema({
    sender: String,
    nickname: String,
    reciever: String,
    msg: String,
    created: {type: Date, default: Date.now}
  });

  var ChatModel = mongoose.model('Message',chatSchema);

  var OnlineUsers = [];
  io.on('connection', function(socket){
    console.log('someone connected to the server');

     socket.on('login', function(userData){
      users2.push({'id': userData.id, 'socket': socket.id});
      console.log(users2);
    })
    //sendData, for message, call, whatever
    socket.on('sendData', function(data){
      var peer_id = data.peer_id;
      //should find the user there
      var peer = _.find(users2, {'id' : peer_id });
      if(!peer){
        return;
      }
      io.to(peer.socket).emit('dataReceived', data);
      console.log(peer.socket);
    });

    socket.on('user_send_status_online', function(data){

      if ( OnlineUsers.indexOf(data) >=0 ){
        io.sockets.emit('server_send_online_user', {'onlineUsers': OnlineUsers} );
      }
      else{
        OnlineUsers.push(data);
        console.log(OnlineUsers);
        io.sockets.emit('server_send_online_user', {'onlineUsers': OnlineUsers} );
      }
    });

    ChatModel.find({}, function(err, docs){
      if(err)throw err;
      console.log('sending old msgs');
      io.emit('load old msgs', docs);
    });

    socket.on('send message',function(data){
      var newMsg = new ChatModel({msg:data.msg,sender: data.sender, reciever: data.reciever,nickname:socket.nickname});
      newMsg.save(function(err){
      if(err){
      throw err;
      }else{
      io.emit('new message',{msg:data.msg,sender: data.sender, reciever: data.reciever,nickname:socket.nickname});
      }
      });
    });

    socket.on('new user',function(data, callback){
      console.log('new user added: '+data);
      if(data in users){
      callback(false);
      }
      else{
      callback(true);
      socket.nickname = data;
      users[socket.nickname]=socket;
      updateNicknames();
      }
    });

    socket.on('disconnect', function(data){
      if(!socket.nickname) return;
      delete users[socket.nickname];
      updateNicknames();
    });
    function updateNicknames(){
		io.emit('usernames',Object.keys(users));
		}
	});

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


  http.listen(port, function(){
    console.log('Video call application is running on port: ' + port);
  });

