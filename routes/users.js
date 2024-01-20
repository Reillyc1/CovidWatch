var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.post('/login', function(req,res,next){

    if('user' in req.body &&
    'pass' in req.body) {
        req.pool.getConnection (function(err,connection){
            if(err){
                res.sendStatus(500);
                return;
            }
            var query = `SELECT u_id,given_name,family_name,username,email_address,user_type
                            FROM user WHERE username = ? AND password = SHA2(?,256);`;
            connection.query(query,[
                req.body.user,
                req.body.pass], function(err,rows,fields){
                    connection.release();
                    if(err){
                        res.sendStatus(500);
                        return;
                    }
                    if(rows.length>0){
                        req.session.user = rows[0];
                        res.json(rows[0]);
                    } else {
                        res.sendStatus(401);
                    }
                });
        });
    } else {
        res.sendStatus(400);
    }

});

router.post('/logout', function(req,res,next){
    delete req.session.user;
    res.end();
});

router.post('/signup', function(req,res,next){

    if('user' in req.body &&
    'pass' in req.body &&
    'email' in req.body &&
    'given_name' in req.body &&
    'family_name' in req.body &&
    'type' in req.body){
        req.pool.getConnection(function(err,connection){
            if(err){
                res.sendStatus(500);
                return;
            }
            var query = `INSERT INTO user (given_name,family_name,username,password,email_address,user_type)
                            VALUES (?,?,?,SHA2(?,256),?,?);`;
            connection.query(query,[
                req.body.given_name,
                req.body.family_name,
                req.body.user,
                req.body.pass,
                req.body.email,
                req.body.type
                ], function(err,rows,fields){
                connection.release();
                if(err){
                    res.sendStatus(500);
                    return;
                } if(rows.length>0){
                        req.session.user = rows[0];
                        res.json(rows[0]);
                } else {
                    res.sendStatus(401);
                }
            });
        });
    } else {
        res.sendStatus(400);
    }

});


router.post('/check_in', function(req,res,next){

    if('check_in' in req.body &&
    'date' in req.body &&
    'time' in req.body &&
    'user' in req.body){
        req.pool.getConnection(function(err,connection){
            if(err){
                console.log(err);
                res.sendStatus(500);
                return;
            }
            var query = `INSERT INTO check_ins (check_in_code,date_,time_,username)
                            VALUES (?,?,?,?);`;
            connection.query(query,[
                req.body.check_in,
                req.body.date,
                req.body.time,
                req.body.user
                ], function(err,rows,fields){
                connection.release();
                if(err){
                    console.log(err);
                    res.sendStatus(500);
                    return;
                }
                res.end();
            });
        });
    } else {
        res.sendStatus(400);
    }

});


router.post('/history', function(req,res,next){

    req.pool.getConnection(function(err,connection){
        if(err){
            res.sendStatus(500);
            return;
        }
        var query = `SELECT check_ins.check_in_code, check_ins.date_, check_ins.time_ FROM check_ins
                        INNER JOIN user
                        WHERE check_ins.username = user.username;`;
        connection.query(query, function(err,rows,fields){
            connection.release();
            if(err){
                res.sendStatus(500);
                return;
            }
            res.json(rows);
        });
    });
});




module.exports = router;

