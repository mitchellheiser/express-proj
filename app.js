require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');

// models
const { User } = require('./models/User');
const { Host } = require('./models/Host');
const EventWBGS = require('./models/EventWBGS');

// Route methods
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const eoiRouter = require('./routes/expression_of_interest')(User, Host, EventWBGS);

const app = express();

// Database connection 
const [dbHost, dbName] = app.settings.env === 'development' ? ['localhost', 'real-world'] : [`${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}${process.env.DB_KEY}`, `${process.env.DB_NAME}`];
const dbConn = `mongodb://${dbHost}/${dbName}`;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Common Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// Use strategy defined in User model to set authentication strategy - currently local strategy
passport.use(User.createStrategy());

// Use static serialize and deserialize of model to encrypt/decrypt user data for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Use sessions
app.use(session({
  secret: "Well that's just, like, your opinion, man.",
}));

// Initialise Passport and connect it into the Express pipeline
app.use(passport.initialize());
// Connect Passport to the session
app.use(passport.session());

// Initilise mongoose
mongoose.connect(dbConn, (err) => {
  if (err) {
    console.log('Error connecting to database', err);
  } else {
    console.log(`Connected to database!`);
  }
});

// Routing
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/expression-of-interest', eoiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Send error
  res.status(err.status || 500);
  res.send(err.message);

  // render the error page
  // res.render('error');
});

module.exports = app;