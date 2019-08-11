const { google } = require('googleapis');

/*******************/
/** CONFIGURATION **/
/*******************/


var uri = "";
var auth;

var googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirect: uri, // this must match your google api settings
};

const defaultScope = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/plus.login'
];

/*************/
/** HELPERS **/
/*************/

function createConnection(url) {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    url
  );
}

function getConnectionUrl(auth) {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: defaultScope
  });
}

function getGooglePlusApi(auth) {
  return google.plus({ version: 'v1', auth });
}

/**********/
/** MAIN **/
/**********/

/**
 * Part 1: Create a Google URL and send to the client to log in the user.
 */
function urlGoogle(param) {
  let ext = '';
  if (param.type === 'buyer') {
    ext = "?type=buyer";
  }

  if (param.type === 'seller') {
    ext = "/seller";
  }

  if (param.type === 'corporate_admin') {
    ext = "?type=corporate_admin";
  }
  let url = '';
  url = encodeURI(process.env.LIVE_REDIRECT + '/register' + ext);
  const auth = createConnection(url);
  url = getConnectionUrl(auth);
  return url;
}

/**
 * Part 2: Take the "code" parameter which Google gives us once when the user logs in, then get the user's email and id.
 */
var getGoogleAccountFromCode = async function(code, param) {
  let ext = '';
  if (param.type === 'buyer') {
    ext = "?type=buyer";
  }

  if (param.type === 'seller') {
    ext = "/seller";
  }

  if (param.type === 'corporate_admin') {
    ext = "?type=corporate_admin";
  }
  let url = '';
  url = encodeURI(process.env.LIVE_REDIRECT + '/register' + ext);
  const auth = createConnection(url);
  const data = await auth.getToken(code);
  const tokens = data.tokens;
  auth.setCredentials(tokens);
  const plus = getGooglePlusApi(auth);
  const me = await plus.people.get({ userId: 'me' });
  const userGoogleId = me.data.id;
  const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
  const userFirstName = me.data.name.givenName;
  const userLastName = me.data.name.familyName;
  const userAvatar = me.data.image.url;
  const displayName = me.data.displayName;
  return {
    id: userGoogleId,
    email: userGoogleEmail,
    tokens: tokens,
    lastName: userLastName,
    firstName: userFirstName,
    username: userGoogleEmail.split('@')[0]
  };
}

module.exports = {
  urlGoogle,
  getGoogleAccountFromCode
}
