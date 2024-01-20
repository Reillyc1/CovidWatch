function dropdown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
};

function showHide(){

    var w=document.getElementsByClassName("logged_in")[0];
    var x=document.getElementsByClassName("logged_in")[1];
    var y=document.getElementsByClassName("logged_out")[0];
    var z=document.getElementsByClassName("logged_out")[1];

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
        if(this.readyState==4 && this.status==200){
          if(this.responseText=="in"){
            w.style.display="block";
            x.style.display="block";
            y.style.display="none";
            z.style.display="none";
          } else if (this.responseText=="out"){
            w.style.display="none";
            x.style.display="none";
            y.style.display="block";
            z.style.display="block";
          }
        }
    };

    xmlhttp.open("GET","/header",true);
    xmlhttp.send();

}

//w3schools collapsible
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
}




function check_ins(){

  var d = new Date();
  var yyyy = d.getFullYear();
  var mm = d.getMonth()+1;
  var dd = d.getDate();

  var my_date = yyyy + '-' + mm + '-' + dd;

  var my_time = new Date().toLocaleTimeString('en-US', { hour12: false,
                                             hour: "numeric",
                                             minute: "numeric",
                                              second: "numeric"});

    let info = {
      check_in: document.getElementById("check_in").value,
      date: my_date,
      time: my_time,
      user: document.getElementById("username").value
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

    xmlhttp.open("POST","/users/check_in",true);
    xmlhttp.setRequestHeader("Content-type","application/json");
    xmlhttp.send(JSON.stringify(info));

}

function username(){

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
        if(this.readyState==4 && this.status==200){
          document.getElementById('username').innerHTML = this.responseText;
        }
    };

    xmlhttp.open("GET","/username",true);
    xmlhttp.send();

}

function email(){

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
        if(this.readyState==4 && this.status==200){
          document.getElementById('email').innerHTML = this.responseText;
        }
    };

    xmlhttp.open("GET","/email",true);
    xmlhttp.send();

}


function history(){

    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function(){
        if(this.readyState==4 && this.status==200){
          document.getElementById('history').innerHTML = this.responseText;
        }
    };

    xmlhttp.open("GET","/history",true);
    xmlhttp.send(JSON.stringify(this.responseText));

}

var app = new Vue ({
    el: 'main',
    data: {
        tab: 'map',
        markers: [],
        form_long: 0,
        form_lat: 0,
    },
    methods: {
        retrieve_markers: function(){

            let req = new XMLHttpRequest();
            req.onreadystatechange = function(){
                if (req.readyState == 4 && req.status == 200)
                {
                    let markers = JSON.parse(req.responseText);
                    for (let x of markers)
                    {
                      x.marker = new mapboxgl.Marker()
                      .setlonglat([x.longitude, x.latitude])
                      .addTo(map);
                    }
                    app.markers = JSON.parse(req.responseText);
                }
            };
            req.open('GET', '/markers', true);
            req.send();
        },
        add_marker: function(){
            let req = new XMLHttpRequest();
            req.open('POST', '/addmarkers', true);
            req.setRequestHeader('Content-type', 'application/json');
            req.send(JSON.stringify{long:this.form_long, lat:this.form_lat});
        }
    }
});
