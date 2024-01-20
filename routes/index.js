var express = require('express');
var router = express.Router();

// var nodemailer = require('nodemailer');

// let transporter = nodemailer.createTransport({
//      host: 'smtp.ethereal.email',
//      port: 587,
//      proxy: 'http://194.195.253.34',
//      auth: {
//          user: 'tony.bailey@ethereal.email',
//          pass: 'MEVTUwrcQbgd7f3Gn7'
//      }
//  });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


//sends email to provided address
// router.post('/email', function(req,res,next){
//     let info = transporter.sendMail({
//         from: "really@real.email", //sender address
//         to: req.body.recipient, //list of receivers
//         subject: req.body.subject,
//         text: req.body.text,
//         html: "<b>"+req.body.text+"</b>" //html body
//     });
//     res.send();
// });


router.get('/header',function(req,res,next){
    if('user' in req.session){
        res.send("in");
    } else {
        res.send("out");
    }
});


router.get('/home', function(req,res,next){
    res.redirect('/');
});


router.get('/account', function(req,res,next){
    if(req.session.user.user_type=='user'){
        res.redirect('/user.html');
    } else if(req.session.user.user_type=='manager'){
        res.redirect('/manager.html');
    } else if(req.session.user.user_type=='admin'){
        res.redirect('/admin.html');
    }
});


// get route to retrieve markers
router.get('/mapmarkers', function(req, res, next) {
  req.pool.getConnection(function (err, connection){
      if (err)
      {
          console.log(err);
          res.sendStatus(500);
          return;
      }
      var query = 'SELECT * FROM mapmarkers;';
      connection.query(query, function(err, row, fields){
          connection.release();
          if (err)
          {
              res.sendStatus(500);
              return;
          }
          res.json(rows);
      });
  });
});

// post route to add markers
router.post('/addmarkers', function(req, res, next) {
      req.pool.getConnection(function (err, connection){
      if (err)
      {
          console.log(err);
          res.sendStatus(500);
          return;
      }
      var query = 'INSERT INTO mapmarkers (longitude, latitude) VALUES (?,?);';
      connection.query(query, [req.body.long, req.body.lat], function(err, row, fields){
          connection.release();
          if (err)
          {
              console.log(err);
              res.sendStatus(500);
              return;
          }
          res.json(rows);
      });
  });
});

router.get('/username', function(req,res,next){
    res.send(req.session.user.username);
});

router.get('/email', function(req,res,next){
    res.send(req.session.user.email_address);
});

module.exports = router;
