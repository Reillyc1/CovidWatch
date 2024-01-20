/* for generating random code */

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() *
 charactersLength));
   }
   return result;
}

console.log(makeid(5));

router.post('/email', function(req,res,next)
{
    let info=transporter.sendMail({
        from: "admin@covidwatch.com",
        to: req.body.recipient,
        subject: req.body.subject,
        text:req.body.text,
        html: "<b>"req.body.text"</b>"
    })
    res.send();
    })
}