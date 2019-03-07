'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const passport    = require('passport');
const session     = require('express-session');
const ObjectID    = require('mongodb').ObjectID;
const mongo       = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');

const app = express();

app.set('view engine', 'pug');

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

passport.serializeUser((user, done) => {
  done(null, user._id);
});

app.route('/')
  .get((req, res) => {
    res.render('pug/index', {title: 'Hello', message: 'Please login', showLogin: true});
  });


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect(301, '/');
};

app.route('/profile')
  .get(ensureAuthenticated, (req, res) => {
    res.render('pug/profile');
  });


app.post('/login', passport.authenticate('local', {failureRedirect: '/'}), (req, res) => {
  res.redirect('/profile');
});



mongo.connect(process.env.DATABASE, {useNewUrlParser: true}, (err, client) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');
    
    const db = client.db();
  
    
    passport.deserializeUser((id, done) => {
      db.collection('users').findOne({_id: new ObjectID(id)}, (err, doc) => {
            done(null, doc);
      });
    });
    
    passport.use(new LocalStrategy(
      function(username, password, done) {
        db.collection('users').findOne({ username: username }, function (err, user) {
          console.log('User "'+ username +'" attempted to log in.');
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          if (password !== user.password) { return done(null, false); }
          return done(null, user);
        });
      }
    ));

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});

