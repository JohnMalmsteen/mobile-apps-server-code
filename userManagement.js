var mongodb = require('mongodb');
var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var md5sum = crypto.createHash('md5');

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

router.route('/register/').post(function(req, res){
   if(req.body.username === null || req.body.password === null || req.body.password.length < 7){
      //respond with a failure here;
      res.status(500).json({error: "Error with request, password must be at least 7 characters"});
   }
   // else if(check if user already exists){
   //    res.status(500).json({error: "User name already exists"});
   // }
   else{
      var salt = crypto.randomBytes(64).toString('hex');
      var user = {username: req.body.username, salt: salt, password: md5sum.update(req.body.password + salt).digest('hex')};

      var token = md5sum.update(crypto.randomBytes(64).toString('hex')).digest('hex');
      session[username] = token;

      res.status(200).json({username: user.username, token: token});
      //put this into the database here
   }
});

router.route('/user/').get(function(req, res){
   //this method should be used to ensure the username the user has entered doesn't exist
});

router.route('/login/').get(function(req, res){
   //generate a token and return it to the user and put it on a dictionary of curently valid tokens to be used for accessing the data
});
