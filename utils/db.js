const mongoose = require("mongoose");
const SlackErrorNotificationBot = require("../src/functions/slack-bot");

/**
 * Facilitate connection to database
 * @param {String} url mongodb connection url
 * @return {*} log to show success or failure of connection
 */
exports.connect = function(url) {
  mongoose.set("useNewUrlParser", true);
  mongoose.set("useFindAndModify", false);
  mongoose.set("useCreateIndex", true);
  mongoose.set("useUnifiedTopology", true);
  mongoose
    .connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
    .then(() => {
      console.log("database successfully connected");
    })
    .catch(err => {
      console.error(`database connection failure: \n ${err.stack}`);
      if (process.env.NOTIFY_SLACK === "true") {
        new SlackErrorNotificationBot({
          username: "BackEndBot",
          type: "error",
          webHookUrl: process.env.SLACK_WEB_HOOK_URL
        }).sendMessage(err);
      }
    });
};
