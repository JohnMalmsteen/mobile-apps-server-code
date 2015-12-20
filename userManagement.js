var mongodb = require('mongodb');
var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');


var app = express();

var session = {};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*'); // null or url

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

var router = express.Router();

var port = process.env.PORT || 5000;

var url = 'mongodb://localhost:27017/nebinstower';

var MongoClient = mongodb.MongoClient;

// Use connect method to connect to the Server
MongoClient.connect(url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);

    // do some work here with the database.

    //Close connection
    db.close();
  }
});

router.route('/register/').post(function(req, res){
   if(req.body.username === null || req.body.password === null || req.body.password.length < 7){
      //respond with a failure here;
      res.status(500).json({error: "Error with request, password must be at least 7 characters"});
   }
   else{
      var md5sum = crypto.createHash('md5');
      var salt = crypto.randomBytes(64).toString('hex');
      var user = {username: req.body.username, salt: salt, password: md5sum.update(req.body.password + salt).digest('hex')};

      MongoClient.connect(url, function(err, db){
         if (err) {
           console.log('Unable to connect to the mongoDB server. Error:', err);
         } else {
            var collection = db.collection('users');

            collection.findOne({username: user.username}, function(err, doc){
               if(err){
                  res.status(500).json({error: "error", message: err});
               }else {
                  if(doc === null){
                     collection.insert(user,function (err, doc) {
                     if (err) {
                        // If it failed, return error
                        res.status(500).json({error: "There was a problem adding the information to the database.", message: err});
                        db.close();
                     }
                     else {
                        var token = crypto.createHash('md5').update(crypto.randomBytes(64).toString('hex')).digest('hex');
                        session[user.username] = {token: token, timeoutTime: (new Date().getTime() + 1200000)};
                        res.status(200).json({username: user.username, token: token});
                        db.close();
                     }
                    });
                 }else{
                    res.status(500).json({error: 'User with that name already exists'});
                    db.close();
                 }
               }
            });
         }
      });
   }
});

router.route('/user/:username').get(function(req, res){
   //this method should be used to ensure the username the user has entered doesn't exist
   MongoClient.connect(url, function(err, db){
      if(err){
         res.status(500).json({error: 'Unable to connect to database', message: err});
      }
      else{
         var collection = db.collection('users');

         collection.findOne({username: req.params.username}, function(err, doc){
            if(err){
               res.status(500).json({error: err});
            }else{
               if(doc === null){
                  res.status(200).json({exists: false});
               }else{
                  res.status(200).json({exists: true});
               }
            }
            db.close();
         });
      }
   });
});

router.route('/login/').get(function(req, res){
   //generate a token and return it to the user and put it on a dictionary of curently valid tokens to be used for accessing the data
});

router.route('/').get(function(req, res){
   res.status(200).json({message: 'This is the Nebins Tower API'});
});

function sessionTimeout(){
   var currentTime = new Date().getTime();
   //console.log("clearing");
   for(var user in session){
      if(user.timeoutTime <= currentTime){
         delete session.user;
      }
   }
}

setInterval(sessionTimeout, 10000);

app.use('/', router);

app.listen(port);
console.log('Server listening on port: ' + port);
