var mongodb = require('mongodb');
var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var https = require('https');
var http = require('http');
var fs = require('fs');

var app = express();

var session = {};

var options = {
  key: fs.readFileSync('sslcert/server.key'),
  cert: fs.readFileSync('sslcert/server.crt')
};

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
                        res.status(200).json({token: token});
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

router.route('/login/').post(function(req, res){
   //generate a token and return it to the user and put it on a dictionary of curently valid tokens to be used for accessing the data
   var postedUsername = req.body.username;
   var postedPassword = req.body.password;

   MongoClient.connect(url, function(err, db){
      if(err){
         res.status(500).json({error: 'Unable to connect to database', message: err});
      }
      else{
         var collection = db.collection('users');

         collection.findOne({username: postedUsername}, function(err, doc){
            if(err){
               res.status(500).json({error: err});
            }else{
               if(doc === null){
                  res.status(404).json({error: 'User does not exist'});
                  db.close();
               }
               else{
                  var md5sum = crypto.createHash('md5');
                  var hashedPassword = md5sum.update(postedPassword + doc.salt).digest('hex');
                  if(hashedPassword === doc.password){
                     var token = crypto.createHash('md5').update(crypto.randomBytes(64).toString('hex')).digest('hex');
                     session[postedUsername] = {token: token, timeoutTime: (new Date().getTime() + 1200000)};
                     res.status(200).json({token: token});
                     db.close();
                  }
                  else{
                     res.status(400).json({error: "Password Incorrect"});
                     db.close();
                  }
               }
            }
         });
      }
   });
});

router.route('/saveCharacters/').post(function(req, res){
   var bodyJSON = req.body;
   if(bodyJSON.username === undefined || bodyJSON.token === undefined || bodyJSON.savedata === undefined || bodyJSON.username === null || bodyJSON.token === null || bodyJSON.savedata === null){
      res.status(400).json({error: "Malformed JSON body"});
   }
   else{
      if(session[bodyJSON.username] === undefined || session[bodyJSON.username] === null){
         res.status(503).json({error: "No valid session"});
      }else{
         MongoClient.connect(url, function(err, db){
            if(err){
               res.status(500).json({error: err});
            }else{
               var collection = db.collection('savedGames');

               collection.update({username: bodyJSON.username}, {username: bodyJSON.username, savedata: bodyJSON.savedata}, {upsert:true, safe:false}, function(err, data){
                  if(err){
                     res.status(500).json({error: err});
                  }else{
                     res.status(200).json({message: 'Save Successful'});
                  }
               });
            }
         });
      }
   }
});

router.route('/loadCharacters/').post(function(req, res){
   var bodyJSON = req.body;

   if(session[bodyJSON.username] === undefined || session[bodyJSON.username] === null){
      res.status(503).json({error: "No valid session"});
   }else{
      if(bodyJSON.token === session[bodyJSON.username].token){
         MongoClient.connect(url, function(err, db){
            if(err){
               res.status(500).json({error: err});
            }else{
               var collection = db.collection('savedGames');

               collection.findOne({username: bodyJSON.username}, function(err, doc){
                  if(doc === null){
                     res.status(404).json({message: 'No save game found'});
                     db.close();
                  }else{
                     res.status(200).json(doc.savedata);
                  }
               });
            }
         });
      }
   }
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

https.createServer(options, app).listen(port);
http.createServer(app).listen(5001);
console.log('HTTPS Server listening on port: ' + port);
console.log('HTTP Server listening on port: ' + 5001);
