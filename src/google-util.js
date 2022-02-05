import { google } from 'googleapis';

const googleConfig = {
    clientId: '615359316686-bjjsornl9blc9v3njfamm13aind6lbh8.apps.googleusercontent.com', // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
    clientSecret: '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', // e.g. _ASDFA%DFASDFASDFASD#FAD-
    redirect: 'http://localhost:3000/googleGranted' // this must match your google api settings
  };

//   {
//     "web": {
//       "client_id": "615359316686-bjjsornl9blc9v3njfamm13aind6lbh8.apps.googleusercontent.com",
//       "project_id": "marauder-map-336517",
//       "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//       "token_uri": "https://oauth2.googleapis.com/token",
//       "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//       "client_secret": "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",
//       "redirect_uris": ["http://127.0.0.1:5500/index.html"]
//     }
//   }

  function createConnection(){
      return new google.auth.OAuth2(
        googleConfig.clientId,
        googleConfig.clientSecret,
        googleConfig.redirect
      )
  }

  /**
 * This scope tells google what information we want to request.
 */
const defaultScope = [
    
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];
  
  /**
   * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
   */
  function getConnectionUrl(auth) {
    return auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
      scope: defaultScope
    });
  }
  
  /**
   * Create the google url to be sent to the client.
   */
  function urlGoogle() {
    const auth = createConnection(); // this is from previous step
    const url = getConnectionUrl(auth);
    return url;
  }


/**
 * Part 2: Take the "code" parameter which Google gives us once when the user logs in, then get the user's email and id.
 */
 async function getGoogleAccountFromCode(code) {
    
    const auth = createConnection();
    const data = await auth.getToken(code);
    const tokens = data.tokens;
    
    
    auth.setCredentials(tokens);
    // console.log(tokens)
    
    
    const me = await google.people({version:'v1', auth: auth}).people.get({resourceName:'people/me', personFields:'names,emailAddresses'})
    console.log(me.data)
    const userGoogleId = me.data.id;
    const userGoogleName = me.data.names[0].displayName;
    const userGoogleEmail = me.data.emailAddresses[0].value;
    console.log(userGoogleId)
    return {
      name: userGoogleName,
      email: userGoogleEmail,
      tokens: tokens,
    };
  }

 export default {
    urlGoogle,
    getGoogleAccountFromCode,
 } 