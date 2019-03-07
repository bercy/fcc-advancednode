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
const routes        = require('./Routes');
const auth          = require('./Auth');



const app = express();

app.set('view engine', 'pug');

app.use((req, res, next) => {
  console.log(req.url);
  next();
});


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




mongo.connect(process.env.DATABASE, {useNewUrlParser: true}, (err, client) => {
  if(err) {
    console.log('Database error: ' + err);
  } else {
    console.log('Successful database connection');
    
    const db = client.db();
    
    routes(app, db
  
    
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
              if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }

              return done(null, user);
            });
          }
        ));

        passport.serializeUser((user, done) => {
      done(null, user._id);
    });

    app.route('/')
      .get((req, res) => {
        res.render('pug/index', {title: 'Home Page', message: 'Please login', showLogin: true, showRegistration: true});
      });


    function ensureAuthenticated(req, res, next) {
      if (req.isAuthenticated()) {
          return next();
      }
      res.redirect('/');
    };

    app.route('/profile')
      .get(ensureAuthenticated, (req, res) => {
        res.render(process.cwd() + '/views/pug/profile', {username: req.user.username});
      });


    app.post('/login', passport.authenticate('local', {failureRedirect: '/'}), (req, res) => {
      res.redirect('/profile');
    });

    app.get('/logout', (req, res) => {
      req.logout();
      res.redirect('/');
    });
    
    app.route('/register')
      .post((req, res, next) => {
          db.collection('users').findOne({ username: req.body.username }, function (err, user) {
              if(err) {
                  next(err);
              } else if (user) {
                  res.redirect('/');
              } else {
                  const hash = bcrypt.hashSync(req.body.password, 12);
                  db.collection('users').insertOne(
                    {username: req.body.username,
                     password: hash},
                    (err, doc) => {
                        if(err) {
                            res.redirect('/');
                        } else {
                            next(null, user);
                        }
                    }
                  )
              }
          })},
        passport.authenticate('local', { failureRedirect: '/' }),
        (req, res) => {
            res.redirect('/profile');
        }
    );
  /*  
    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found');
    });
*/
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
  }
});




