


let map;
let markers = [];
let id;
    
async function loadMap(currentLocation) {
    let mapOptions;
    let marker;
    try {
        const setLocation = await ajaxPost('http://localhost:3000/map', currentLocation)
        if(setLocation.status == 200){
        
            const users = await fetch('http://localhost:3000/map')
            const data = await users.json()
            
            data.forEach(mark => {
                if (!map){
                    mapOptions = {
                        
                        zoom: 14,
                    }
                    map = new google.maps.Map(document.getElementById("map"), mapOptions)
                }
                if(mark.me){
                    map.setCenter(new google.maps.LatLng(mark.position.latitude, mark.position.longitude))
                }
                marker = new google.maps.Marker({
                    position: new google.maps.LatLng(mark.position.latitude, mark.position.longitude),
                    label: mark.name[0],
                    title: mark.name
                }) 
                markers.push(marker)
            });
            markers.forEach(marker =>{
                marker.setMap(map);
            })
        } else {
            throw Error("Couldn't set location on server")
        }
    } catch (err) {
        console.log(err)
    }
    id = navigator.geolocation.watchPosition(track)
}


async function track(position){
    let currentLocation = {
        latitude: position.coords.latitude, 
        longitude: position.coords.longitude,
    }

    try {
        const setLocation = await ajaxPost('http://localhost:3000/map', currentLocation) //send latest position
        if(setLocation.status == 200){
            const users = await fetch('http://localhost:3000/map') //if set correctly then get the updated active users array
            const data = await users.json()
            
            console.log(data)
            console.log(markers)

            data.forEach(user=>{ // check for new users in the data array
                if (markers.filter(e => e.title === user.name).length > 0) {
                    user.ISNEW = false
                } else {
                    user.ISNEW = true
                }
            })


            markers.forEach(marker=>{ //check for logged off users in the data array
                if (data.filter(e => e.name === marker.title).length > 0) {
                    marker.ISGONE = false
                } else {
                    marker.ISGONE = true
                }
            })

         
            //move markers that are already on the map
            data.forEach(user => {
                
                if(user.me){
                    map.setCenter(new google.maps.LatLng(user.position.latitude, user.position.longitude))
                }
                // if markers array on client includes a user sent from server, move marker
                markers.forEach(marker =>{
                    if(marker.title === user.name){
                        marker.setPosition(new google.maps.LatLng(user.position.latitude, user.position.longitude))

                    }
                })
            });

            
            markers.forEach(marker =>{//marker in the markers array was not found in the data from server therefore IS GONE 
                if(marker.ISGONE){ 
                    marker.setMap(null)
                } else {
                    marker.setMap(map)
                }
            })

            console.log(markers)

           
            data.forEach(user=>{ // user in data from server was not found in markers array therefore IS NEW
                if (user.ISNEW){
                const newMarker = new google.maps.Marker({
                    position: new google.maps.LatLng(user.position.latitude, user.position.longitude),
                    label: user.name[0],
                    title: user.name,
                    map: map
                    }) 
                markers.push(newMarker)
                }
            })      
        }
    } catch (err) {
        console.log(err)
    }
}

const clientID = {
    client_id: "615359316686-bjjsornl9blc9v3njfamm13aind6lbh8.apps.googleusercontent.com",
}

function init() {
    gapi.load('auth2', function() {
      gapi.auth2.init(clientID).then(onInit, onError)
     });
  }

const onInit = async function (){

    const GoogleAuth = gapi.auth2.getAuthInstance() 
    
    if  (GoogleAuth.isSignedIn.get()){

    googleUser = GoogleAuth.currentUser.get()
    

    // The ID token you need to pass to your backend:
    const id_token = { id_token: googleUser.getAuthResponse().id_token};
    
    // Send the ID token to back end to identify each user
    const signIn = await ajaxPost('http://localhost:3000/signin', id_token)
    
        if(signIn.status === 200){
            console.log("signed in!")
            if (!document.getElementById("map")){
                createMap();
            } else {
                const position = await getStartingPosition()
                if (position.coords){
                    let currentLocation = {
                        latitude: position.coords.latitude, 
                        longitude: position.coords.longitude,
                    }
                    loadMap(currentLocation); //if got a position then load the map
                }
            }
            
        } else {
            console.log("not signed in!")
        }

    }
    GoogleAuth.isSignedIn.listen(listener)
}

const onError = function (error){
    console.log("Failed to initialise gapi")
}

async function listener(signsIn){
    console.log(signsIn)
    if(signsIn){
        if(!document.getElementById('map')){
            await createMap();
        } else {
            const position = await getStartingPosition()
                if (position.coords){
                    let currentLocation = {
                        latitude: position.coords.latitude, 
                        longitude: position.coords.longitude,
                    }
                    loadMap(currentLocation); //if got a position then load the map
                }
        }
        
    } else {
        signOut();
        console.log("User signed out")
    } 
    //check if user is signed in on the backend
    
}

async function createMap(){
    if(!document.getElementById("map")){
    let m = document.getElementById('app-container').appendChild(document.createElement('div'))
        
    m.setAttribute('id', 'map') //if sign in ok then make the div's ID = map
    const position = await getStartingPosition()
    if (position.coords){
        let currentLocation = {
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude,
        }
        loadMap(currentLocation); //if got a position then load the map
    } else {
        throw Error ("Something went wrong with the geolocation")
    }
}
}


function getStartingPosition() {
    return new Promise(function(resolve, reject) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position)=>{
            resolve(position);  
            })
            
        } else {
            reject({msg:"Geolocation is not supported by this browser."});
        }
    }); 
}   

async function onSignIn(googleUser) {
    try{
        // Useful data for your client-side scripts:
        var profile = googleUser.getBasicProfile();
    
        // The ID token you need to pass to your backend:
        const id_token = { id_token: googleUser.getAuthResponse().id_token};

        // Send the ID token to back end to identify each user
        const signIn = await ajaxPost('http://localhost:3000/signin', id_token)
        console.log(signIn.status)
        if(signIn.status === 200){
            console.log("signed in!")
            createMap();
        } else {
            console.log("not signed in!")
        }

    } catch (err){
        console.log(err)
    }
}

  function signOut() {
    let auth2 = gapi.auth2.getAuthInstance().signOut()
    .then(async ()=>{
        let signout = await fetch('http://localhost:3000/signout')
        if(signout.status == 200){
            console.log('Signed out successfully!')
            document.getElementById("map").remove()
            navigator.geolocation.clearWatch(id)
        }
    } 
    )
    
   
  }


 function ajaxPost(url, data){
     return new Promise(async function (resolve, reject){
            const userLogin = await fetch(url,{
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
                headers:{
                    'Content-Type': 'application/json'
                },
                redirect: 'manual', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                body: JSON.stringify(data)
            }).then(response =>{ 
                resolve(response);
            }).catch (err =>{
                reject(err)
              })
             
         })
  }


  async function ajaxGet(url){
    try{
       const userLogin = await fetch(url, {
           method: 'GET',
           mode: 'cors',
           credentials: 'include',
           headers:{
               'Content-Type': 'application/json'
           },
           redirect: 'manual', // manual, *follow, error
           referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
       })
       return userLogin;
    } catch (err) {
        console.log(err)
    }
}
