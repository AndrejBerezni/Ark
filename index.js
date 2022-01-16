const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const User = require('./models/user');
const ejsMate = require('ejs-mate');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');

mongoose.connect('mongodb://localhost:27017/Ark')
    .then(() => {
        console.log("Connection open")
    })
    .catch(err => {
        console.log(err)
    });

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use(express.urlencoded({ extended: true }));

//Session and Flash:
const sessionConfig = {
    secret: 'notagoodsecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //it is in miliseconds
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};
app.use(session(sessionConfig));
app.use(flash());
app.use((req, res, next) => {
    res.locals.messages = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

const requireLogin = (req, res, next) => {
    if(!req.session.user_id) {
        res.redirect('/login');
    } else {
        next();
    }
};
//Home routes:
app.get('/', (req, res) => {
    res.render('home')
});
app.get('/home', (req, res) => {
    res.render('home')
});

//Login routes:
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async(req, res) => {
    const {username, password} = req.body;
    const foundUser = await User.findAndValidate(username, password);
    if (foundUser) {
        req.session.user_id = foundUser._id;
        req.flash('success', 'You have logged in successfully!');
        res.redirect('/loggedin');
    } else {
        req.flash('error', 'Username or Password incorrect!');
        res.redirect('/login');
    }
})
//Logged in:
app.get('/loggedin', requireLogin, async (req, res) => {
    const user = await User.findById(req.session.user_id);
    res.render('loggedin', {user});
});

//Register routes:
app.get('/register', async (req, res) => {
    res.render('register')
});

app.post('/register', async (req, res,) => {
    const { username, password } = req.body;
    const user = new User({ username, password });
    await user.save();
    req.session.user_id = user._id;
    req.flash('success', 'Registered Successfully!')
    res.redirect('/loggedin')
});

//Log Out:
app.post('/logout', (req, res) => {
    req.session.user_id = null;
    res.redirect('/login');
});

//Not found:

app.get('*', (req, res) => {
    res.render('notFound')
})
//Listen:
app.listen(3000, () => {
    console.log('App listening to PORT 3000');
})