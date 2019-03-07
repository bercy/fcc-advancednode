'use strict';

const express       = require('express');
const bodyParser    = require('body-parser');
const fccTesting    = require('./freeCodeCamp/fcctesting.js');
const passport      = require('passport');
const session       = require('express-session');
const ObjectID      = require('mongodb').ObjectID;
const mongo         = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');
const bcrypt        = require('bcrypt');
const routes        = require('./routes.js');
const auth          = require('./auth.js');



const app = express();

app.set('view engine', 'pug');
/*
app.use((req, res, next) => {
  console.log(req.url);
  next();
});
*/

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

/*
if (process.env.ENABLE_DELAYS) app.use((req, res, next) => {
  
  switch (req.method) {
    case 'GET':
      switch (req.url) {
        //case '/logout': return setTimeout(() => next(), 500);
        //case '/profile': return setTimeout(() => next(), 700);
        default: next();
      }
    break;
    case 'POST':
      switch (req.url) {
        case '/login': return setTimeout(() => next(), 2000);
        default: next();
      }
    break;
    default: next();
  }
});
*/



mongo.connect(process.env.DATABASE, {useNewUrlParser: true}, (err, client) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');
    
    const db = client.db();
    
    auth(app, db);
    routes(app, db);
    
    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found');
    });
    
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});




