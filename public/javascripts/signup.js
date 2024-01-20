
function myFunction()
{
    var form1 = document.getElementById("form");
    var image= document.getElementById("user");
    var form2= document.getElementById("form2");

    if (image.checked == true)
    {
      form1.style.display = "block";
      form2.style.display = "none";
    }
    else
    {
        form1.style.display = "none";
    }

}

function myFunction2()
{
    var manager= document.getElementById("Manager");
    var form2 = document.getElementById("form2");
    var text = document.getElementById("form");

    if (manager.checked == true)
    {
      form2.style.display = "block";
      text.style.display = "none";
    }
    else
    {
        form2.style.display = "none";
    }

}


function signup(){

    var user_type;

    if(document.getElementById("user").checked){
        user_type = document.getElementById("user").value;
    } else if(document.getElementById("manager").checked){
        user_type = document.getElementById("manager").value;
    }

    let userInfo = {
        user: document.getElementById("username").value,
        pass: document.getElementById("password").value,
        given_name: document.getElementById("given_name").value,
        family_name: document.getElementById("family_name").value,
        email: document.getElementById("email").value,
        type: user_type
    };

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
        if(this.status==200){
            document.location.href="/";
        } else if (this.readyState==4 && this.status>=400){
            alert("Sign Up Failed");
        }
    };
    document.location.href="/";

    xmlhttp.open("POST","/users/signup",true);
    xmlhttp.setRequestHeader("Content-type","application/json");
    xmlhttp.send(JSON.stringify(userInfo));

}