import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser';
import { connect, User} from './src/database.js';

import {OAuth2Client} from 'google-auth-library';

const CLIENT_ID= "615359316686-bjjsornl9blc9v3njfamm13aind6lbh8.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

const app = express();
const port = process.env.PORT || 3000;


app.use(express.static("public"));
app.use(express.json());
app.use(session({
  secret: 'ssshhhhh',
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    autoRemove: 'interval'
  }),
  cookie: { 
    
    maxAge: 360000,
  },
  saveUninitialized: false,
  resave: false}))
  
app.use(cookieParser())

function isThisMe(checkedSession, thisSession){
  if(checkedSession.name == thisSession.name){
    return true
  } else {
    return false
  }
}


app.post('/map', isSignedIn, (req, res)=>{

  req.session.position = req.body
  console.log(`Location update from: ${req.session.name} at ${req.session.position.latitude}, ${req.session.position.longitude}`)
  res.sendStatus(200)
});

app.get('/map', isSignedIn, (req, res)=>{
  let trackedUsers = [];
  req.sessionStore.all((err, sessions)=>{
    
    if(sessions){
      sessions.forEach((session)=>{
      
        if(session.name&&session.position){
          console.log("Session has a name and position")
          const user = {
            me: isThisMe(session, req.session), //append a boolean for "me" so that the client knows which marker refers to themselves
            name: session.name,
            position: session.position
          }
          trackedUsers.push(user);
        }
      })
      
    }
    res.setHeader('Content-Type', 'application/json');
    res.status(200)
    res.send(trackedUsers);
})
});

app.post('/signin', notSignedIn, verifyIdToken, async (req, res)=>{
      
    req.session.sub = res.locals.verifiedGoogleProfile.sub;
    req.session.name = res.locals.verifiedGoogleProfile.name
    console.log(req.session)
    const SaveSession =  new Promise((resolve, reject) => {
        req.session.save((err) => {      
          // redirect home
          if (err) {
            reject(err);
          }
          resolve(1);
        })
      });
    
    SaveSession.then((success) =>{
      if (success){
        
        res.sendStatus(200)
      }
    });
    
  })

  app.post('/track', isSignedIn, (req, res)=>{
    req.session.position = req.body
    let trackedUsers = [];
    req.sessionStore.all((err, sessions)=>{
      if(sessions){
        sessions.forEach((session)=>{
          if(session.name && session.position){
            const user = {
              me: isThisMe(session, req.session), //append a boolean for "me" so that the client knows which marker refers to themselves
              name: session.name,
              position: session.position
            }
            trackedUsers.push(user);
          }
        })
      }
    });
    res.setHeader('Content-Type', 'application/json');
    res.status(200)
    res.send(trackedUsers);
  })

  app.get('/signOut', async (req, res)=>{
    try{
      const signedOut = await req.session.destroy();
      res.status(200)
      res.redirect('/')
    } catch (err){
      console.log(err)
    }    
  })

app.listen(port, ()=>{
    console.log(`Tracker app listening at http://localhost:${port}`);
})

async function verifyIdToken(req, res, next){
  try{
    const ticket = await client.verifyIdToken({
      idToken: req.body.id_token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    res.locals.verifiedGoogleProfile = payload;
    next();
    
  } catch (err){
    res.send(err)
  }
}

function isSignedIn(req,res,next){
  if(req.session.sub){
    // console.log(`${req.session.name} is signed in`)
    next();
  } else {
    console.log(`User is NOT signed in`)
    res.sendStatus(401)
  } 
   
}
function notSignedIn(req,res,next){
  if (!req.session.sub) {
    next();
  } else {
    res.sendStatus(200)
    
  }
  
  
}