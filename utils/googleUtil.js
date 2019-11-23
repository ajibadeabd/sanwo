const { google } = require("googleapis");
const rp = require("request-promise");
/*******************/
/** CONFIGURATION **/
/*******************/

var uri = "";
var auth;

var googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirect: uri // this must match your google api settings
};

const defaultScope = [
  "https://www.googleapis.com/auth/plus.me",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/plus.login"
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
    access_type: "offline",
    prompt: "consent",
    scope: defaultScope
  });
}

function getGooglePlusApi(auth) {
  return google.plus({ version: "v1", auth });
}

/**********/
/** MAIN **/
/**********/

/**
 * Part 1: Create a Google URL and send to the client to log in the user.
 */
function urlGoogle(param) {
  let ext = "";
  if (param.type === "buyer") {
    ext = "/#/register?type=buyer";
  }

  if (param.type === "seller") {
    ext = "/#/register/seller";
  }

  if (param.type === "corporate_admin") {
    ext = "/#/register?type=corporate_admin";
  }
  if (param.type === "undefined") {
    ext = "/#/login";
  }
  let url = "";
  url = encodeURI(process.env.LIVE_REDIRECT + ext);
  const auth = createConnection(url);
  url = getConnectionUrl(auth);
  return url;
}

/**
 * Part 2: Take the "code" parameter which Google gives us once when the user logs in, then get the user's email and id.
 */
var getGoogleAccountFromCode = async function(code, param) {
  try {
    const options = {
      method: "GET",
      uri:
        "https://people.googleapis.com/v1/people/me?personFields=emailAddresses,names,photos",
      headers: {
        Authorization: "Bearer " + code
      }
    };
    var me = await Request(options);
    me = JSON.parse(me);
    const userGoogleEmail = me.emailAddresses[0].value;
    const userFirstName = me.names[0].givenName;
    const userLastName = me.names[0].familyName;
    const userAvatar = me.photos[0].url;
    const displayName = me.names[0].displayName;
    return {
      email: userGoogleEmail,
      lastName: userLastName,
      firstName: userFirstName,
      avatar: userAvatar,
      username: userGoogleEmail.split("@")[0]
    };
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  urlGoogle,
  getGoogleAccountFromCode
};
