const passport = require('passport');
const bcrypt   = require('bcrypt');



module.exports = function (app, db) {
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
}