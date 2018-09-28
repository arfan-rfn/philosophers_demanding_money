const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const theories = require('./data/theories');

const app = express();

mongoose.connect('mongodb://asif:sharif1@ds215822.mlab.com:15822/phil220', { useNewUrlParser: true } );

var db = mongoose.connection;
var Schema = mongoose.Schema;

// define Schema
var theorySchema = new Schema({
    id: Number,
    theory: String,
    gain: Number
});

var dbTheory = mongoose.model('theoryDB', theorySchema);

const port = process.env.PORT || 3000;
app.set('view engine', 'ejs');

app.use(cookieSession({
    name: 'session',
    keys: ['lasdkfjoa345l53ljs'], 
    // Cookie Options
    maxAge: 5 * 24 * 60 * 60 * 100 // 24 hours
  }));

app.use(bodyParser.urlencoded({
     extended: false     
})); 

app.use('/public', express.static('./public'));

app.use(bodyParser.json());


app.get('/', (req, res) =>{

    /*
    // save init data to the DB
    for(var i = 0; i < Object.keys(theories).length; i++){
        var th = new dbTheory({
            id: i,
            theory: theories[i.toString()],
            gain: 0
        });
    
        th.save((err, data)=>{
            console.log(data);
            if(err){
                console.log(err);
            

            }
        });
    }

    */

    req.session.coin = req.session.coin || 501;
    req.session.questions = req.session.questions || '::';
    if(completed(req)){
        res.redirect('/result');
    }else{
        res.render('home', {coin: req.session.coin});
    }
    
});

app.get('/question', (req, res)=>{
    if (noAuth(req)){
        return res.render('error', {error: "not allow to visit"});
    }
    if(completed(req)){
        return res.redirect('/result');
    }
    var num_of_theory = Object.keys(theories).length;
    var question_done = req.session.questions.split('::').filter(item => item);

    var idNum = Math.floor(Math.random() * num_of_theory);
    
    while(question_done.includes(idNum.toString())){
        idNum = Math.floor(Math.random() * num_of_theory);
    }
    console.log('id', idNum, ' question done', question_done);
    return res.render('index', {theory_name: theories[idNum.toString()], id: idNum, coin_remain: req.session.coin});
});

app.post('/update/:id', (req, res)=>{
    if (noAuth(req)){
        return res.render('error', {error: "not allow to visit"});
    }
    if(completed(req)){
        return res.redirect('/result');
    }
    var coin = req.session.coin - req.body.coin;
    req.session.questions += req.params.id + '::';
    var questionList = req.session.questions.split('::').filter(item => item);
    if(questionList.length >= Object.keys(theories).length){ 
        console.log('you don\'t have enough questions');
        req.session.coin = coin;
        res.redirect('/result');
    }else if (coin <= 1){  // don't have enough coins
        // add all the remaining coins to the theory
        console.log('you have less coin', req.session.coin);
        dbTheory.findOneAndUpdate({id: req.params.id}, {$inc: {gain: req.session.coin}}, (err, data)=>{
            console.log(data);
        });
        req.session.coin = 1;
        res.redirect('/result');
        // res.redirect('/rslt');
    }else{
        dbTheory.findOneAndUpdate({id: req.params.id}, {$inc: {gain: req.body.coin}}, (err, data)=>{
            console.log(data);
        });
        req.session.coin = coin;
        res.redirect('/question');
    }
});

app.get('/rslt', (req, res) =>{
    dbTheory.find().sort('-gain').exec((err, data)=>{
        if(err){
            return res.end('something went wrong, please try again later');
        }
        return res.render('result', {coin: req.session.coin, result: data});
    });
});

app.get('/result', (req, res) =>{
    if (noAuth(req)){
        return res.render('error', {error: "not allow to visit"});
    }
    if(completed(req)){
        // dbTheory.find({}, (err, data)=>{
        //     res.render('result', {coin: req.session.coin, result: data});
        //     if(err){
        //         res.end('something went wrong, please try again later');
        //     }
        // });

        dbTheory.find().sort('-gain').exec((err, data)=>{
            if(err){
                res.end('something went wrong, please try again later');
            }else{
                res.render('result', {coin: req.session.coin, result: data});
            }
        });
    }else{
        return res.redirect('/');
    }
});

function noAuth(req){
    return !(req.session.coin && req.session.questions);
}

function completed(req){
    var coin = req.session.coin;
    var qstn = req.session.questions;

    if(!noAuth(req)){
        var questionList = qstn.split('::').filter(item => item);
        if(parseInt(coin) <= 1 || questionList.length >= Object.keys(theories).length){
            console.log('Game Over');
            return true;
        }
    }
    return false;
}

app.listen(port, ()=>{
    console.log(`listening from the port ${port}`);
});
