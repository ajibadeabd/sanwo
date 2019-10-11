const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const google = require("../../utils/googleUtil");
const helpers = require("../../utils/helpers");
const notificationEvents = require("../../utils/notificationEvents");
const mailer = require("./../../utils/mailer");
const { userService } = require("../services");

const generateResetToken = () =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(20, (error, buffer) =>
      error ? reject(error) : resolve(buffer.toString("hex"))
    );
  });
/**
 * send a password reset mail to a user along with a validation token
 * @param {Object} req
 * @param {Object}res
 * @param {function}next
 * @param {Boolean}isNewUser used to check of the method was after a new user sign up
 * @return {Object} response
 */
const forgotPassword = async (req, res, next, isNewUser = false) => {
  const query = { email: req.body.email };
  try {
    //  check if email exists
    const result = await req.Models.User.valueExists(query);

    // If it doesn't return proper error message
    if (!result)
      return res
        .status(422)
        .json({ success: false, message: "Email doesn't exist" });

    //  yay! it does. let's generate a token
    const resetPasswordToken = await generateResetToken();

    //  update token to the user object in DB, and set expiry to 24hr
    const user = await req.Models.User.findOneAndUpdate(
      query,
      { resetPasswordToken, resetPasswordExpires: Date.now() + 86400000 },
      { new: true }
    );

    notificationEvents.emit("send_password_reset_email", { user });
    if (!isNewUser) {
      res.json({
        success: true,
        message: "Kindly check your email for further instructions",
        data: null
      });
    }
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const _createBuyer = async (req, res) => {
  try {
    const user = await userService.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      password: req.body.password,
      accountType: req.body.accountType,
      cooperative: req.body.cooperative
    });
    res.send({
      success: true,
      message: `Your registration successful. We're happy to have you here at ${process.env.APP_NAME}`,
      data: user
    });
    // if (user) {
    //   // create address record for our new user
    //   const address = await addressService.create({
    //     user: user._id,
    //     firstName: user.firstName,
    //     lastName: user.lastName,
    //     phoneNumber: user.phoneNumber,
    //     address: req.body.address,
    //     state: req.body.state,
    //     city: req.body.city,
    //     country: req.body.country,
    //     zip: req.body.zip
    //   })
    //   // update the users primary address
    //   user.address = address._id
    //   user.save()
    // }
    // send welcome email to buyer
    notificationEvents.emit("registered_new_buyer", { user });
  } catch (e) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
    throw new Error(e);
  }
};

const _createSuperAdmin = (req, res, next) => {
  req.Models.User.create(
    {
      name: req.body.name,
      email: req.body.email,
      accountType: req.body.accountType
    },
    (err, result) => {
      if (err) {
        throw err;
      } else {
        res
          .send({
            success: true,
            message:
              "Your registration successful. Password reset link sent to your email.",
            data: result
          })
          .status(201);
        forgotPassword(req, res, next, true);
      }
    }
  );
};

const _createSeller = async (req, res, next) => {
  const user = await req.Models.User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    accountType: req.body.accountType,
    businessName: req.body.businessName,
    businessRegistrationNumber: req.body.businessRegistrationNumber,
    businessRegistrationDocument: req.body.businessRegistrationDocument,
    businessAddress: req.body.businessAddress,
    businessProductCategory: req.body.businessProductCategory,
    businessSellingOnOtherWebsite: req.body.businessSellingOnOtherWebsite
  });

  if (!user) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin"
    });
  }
  res.status(201).send({
    success: true,
    message:
      "Your registration successful. Password reset link sent to your email.",
    data: user
  });
  forgotPassword(req, res, next, true);
};

const _createCorporateAdmin = async (req, res, next) => {
  const result = await req.Models.User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phoneNumber: req.body.phoneNumber,
    email: req.body.email,
    corporationName: req.body.corporationName,
    password: req.body.password ? req.body.password : null,
    accountType: req.body.accountType
  });

  if (!result) {
    res.status(401).send({
      success: false,
      message: "error while creating the cooperative."
    });
  }
  req.log(`Newly created corporate admin ${JSON.stringify(result)}`);

  res
    .send({
      success: true,
      message:
        "Your registration successful. You'll be notified once your account has been activated",
      data: result
    })
    .status(201);
  // send welcome email
  mailer.sendWelcomeMail(result, req);
  if (!req.body.password) forgotPassword(req, res, next, true);
};

const create = (req, res, next) => {
  const { accountType } = req.body;

  if (accountType === helpers.constants.BUYER) _createBuyer(req, res, next);
  if (accountType === helpers.constants.SELLER) _createSeller(req, res, next);
  if (accountType === helpers.constants.CORPORATE_ADMIN)
    _createCorporateAdmin(req, res, next);
  if (accountType === helpers.constants.SUPER_ADMIN)
    _createSuperAdmin(req, res, next);
};

const login = (req, res) => {
  let { email } = req.body;
  email = email.toLowerCase();
  req.Models.User.findOne({ email })
    .populate("cooperative address", "-password -relatedUsers -status")
    .exec((err, user) => {
      if (err) throw err;
      //  If the user does not have password set and it is a google account
      if (user && !user.password && user.social) {
        return res.status(401).send({
          success: false,
          message:
            "Your account was created using your Google account. Please login with your google account to continue.",
          data: null
        });
      }
      if (user && user.status === helpers.constants.ACCOUNT_STATUS.suspended) {
        return res
          .send({
            success: false,
            message:
              "Your account is suspended, contact admin for more details.",
            data: null
          })
          .status(401);
      }

      // If the users account type is seller or corporate admin and the user status is pending
      if (
        user &&
        (helpers.constants.SELLER === user.accountType ||
          user.accountType === helpers.constants.CORPORATE_ADMIN) &&
        user.status === helpers.constants.ACCOUNT_STATUS.pending
      ) {
        return res
          .send({
            success: false,
            message:
              "Your account is still pending confirmation. You will be notified once your account has been activated",
            data: null
          })
          .status(401);
      }

      //  If the user does not have password set adn is not a google account
      if (user && !user.password && !user.social) {
        return res.status(401).send({
          success: false,
          message:
            "You are yet to update your password. Kindly use the password reset link sent to your email or request a new one if link has expired.",
          data: null
        });
      }

      if (user && bcrypt.compareSync(req.body.password, user.password)) {
        const { _id, accountType, status } = user;
        const token = jwt.sign(
          {
            _id,
            accountType,
            status
          },
          process.env.TOKEN_SECRET,
          { expiresIn: "3d" }
        );
        return res.send({
          success: true,
          message: "login successful",
          data: user,
          token
        });
      }

      return res.status(401).send({
        success: false,
        message: "Invalid email or password",
        data: null
      });
    });
};

const passwordReset = async (req, res) => {
  // check if the sent token exists and hasn't expired
  try {
    const user = await req.Models.User.findOne({
      resetPasswordToken: req.query.token,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    });
    //  if a user was found update password and reset forgotPasswordFields
    if (!user) {
      return res.status(400).send({
        success: false,
        message: "Password reset token is invalid or has expired."
      });
    }
    // if not return a proper message
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).send({
      success: true,
      message: "Password reset successful."
    });
  } catch (error) {
    return res.send({
      success: false,
      message: error.message
    });
  }
};

const getCooperatives = (req, res) => {
  let limit = parseInt(req.query.limit, 10);
  let offset = parseInt(req.query.offset, 10);
  offset = offset || 0;
  limit = limit || 10;
  req.Models.User.find({
    accountType: helpers.constants.CORPORATE_ADMIN,
    $and: [{ status: helpers.constants.ACCOUNT_STATUS.accepted }]
  })
    .select("firstName lastName _id corporationName")
    .skip(offset)
    .limit(limit)
    .exec((err, results) => {
      if (err) {
        throw err;
      } else {
        res.send({
          success: true,
          message: "cooperatives",
          data: {
            offset,
            limit,
            results
          }
        });
      }
    });
};

const updateUserAvatar = (req, res) => {
  req.Models.User.findOne({ _id: req.authData.userId }).exec((err, user) => {
    if (err) {
      throw err;
    } else {
      // let's remove the old avatar
      if (user && user.avatar !== "avatar.png") {
        helpers.removeFile(`public/upload/avatars/${user.avatar}`);
      }

      user.avatar = req.body.avatar || user.avatar;
      user.save(error => {
        if (error) throw error;
        return res.send({
          success: true,
          message: "Updated successfully",
          data: user,
          token: req.headers["x-access-token"]
        });
      });
    }
  });
};

const googleUrl = async (req, res) => {
  try {
    const url = await google.urlGoogle(req.query);
    res.send({
      status: true,
      url
    });
  } catch (error) {
    res.send({
      status: false,
      message: "Try again"
    });
  }
};
const googleSignup = async (req, res) => {
  try {
    const gUser = await google.getGoogleAccountFromCode(
      decodeURIComponent(req.body.code),
      req.query
    );
    try {
      let user = await req.Models.User.findOne({ email: gUser.email });
      if (user && user.status === helpers.constants.ACCOUNT_STATUS.suspended) {
        return res
          .send({
            success: false,
            message:
              "Your account is suspended, contact admin for more details.",
            data: null
          })
          .status(401);
      }

      // If the users account type is seller or corporate admin and the user status is pending
      if (
        user &&
        (helpers.constants.SELLER === user.accountType ||
          user.accountType === helpers.constants.CORPORATE_ADMIN) &&
        user.status === helpers.constants.ACCOUNT_STATUS.pending
      ) {
        return res
          .send({
            success: false,
            message:
              "Your account is still pending confirmation. You will be notified once your account has been activated",
            data: null
          })
          .status(401);
      }

      if (user) {
        const { _id, accountType, status } = user;
        const token = jwt.sign(
          {
            _id,
            accountType,
            status
          },
          process.env.TOKEN_SECRET,
          { expiresIn: "3d" }
        );
        user = JSON.parse(JSON.stringify(user));
        delete user.password;
        return res.send({
          token,
          data: user,
          message: "successfully logged in",
          success: true
        });
      }

      // var userId = shortid.generate();
      gUser.social = true;
      gUser.accountType = req.query.type;

      const nUser = new req.Models.User(gUser);
      try {
        let message;
        await nUser.save();

        user = await req.Models.User.findOne({ email: gUser.email });

        if (user.accountType === helpers.constants.CORPORATE_ADMIN) {
          mailer.sendWelcomeMail(user, req);
          message =
            "Your registration successful. You'll be notified once your account has been activated";
        }

        if (user.accountType === helpers.constants.BUYER) {
          notificationEvents.emit("registered_new_buyer", { user });
          message = `Your registration successful. We're happy to have you here at ${process.env.APP_NAME}`;
        }

        if (user.accountType === helpers.constants.SELLER) {
          message = `Your registration successful. We're happy to have you here at ${process.env.APP_NAME}`;
        }

        // If the users account type is seller or corporate admin and the user status is pending
        if (
          user &&
          (helpers.constants.SELLER === user.accountType ||
            user.accountType === helpers.constants.CORPORATE_ADMIN) &&
          user.status === helpers.constants.ACCOUNT_STATUS.pending
        ) {
          return res
            .send({
              success: false,
              message:
                "Your account is still pending confirmation. You will be notified once your account has been activated",
              data: null
            })
            .status(401);
        }
        const { _id, accountType, status } = user;
        const token = jwt.sign(
          {
            _id,
            accountType,
            status
          },
          process.env.TOKEN_SECRET,
          { expiresIn: "3d" }
        );
        user = JSON.parse(JSON.stringify(user));
        return res.send({
          success: true,
          token,
          data: user,
          message
        });
      } catch (createError) {
        return res.send({
          success: false,
          message: "Try again",
          error: createError
        });
      }
    } catch (findError) {
      return res.send({
        success: false,
        message: "Try again",
        error: findError
      });
    }
  } catch (error) {
    return res.send({
      success: false,
      message: "Try again",
      error
    });
  }
};

module.exports = {
  create,
  login,
  forgotPassword,
  passwordReset,
  getCooperatives,
  updateUserAvatar,
  googleUrl,
  googleSignup
};
