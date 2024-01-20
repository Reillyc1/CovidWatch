function login(){

    let userInfo = {
        user: document.getElementById("username").value,
        pass: document.getElementById("password").value
    };

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
        if(this.status==200){
            window.location.assign("/");
        } else if (this.readyState==4 && this.status>=400){
            alert("Login failed");
        }
    };

    xmlhttp.open("POST","/users/login",true);
    xmlhttp.setRequestHeader("Content-type","application/json");
    xmlhttp.send(JSON.stringify(userInfo));

}

function logout(){

    var xmlhttp = new XMLHttpRequest();

    window.location.assign("/");

    xmlhttp.open("POST","/users/logout",true);
    xmlhttp.send();

}