const Validator = require('validatorjs')
const helpers = require('./../functions/helpers')

/**
 * We'll be validating user body request before hitting our controller method using validatorjs
 * to learn more about this module https://www.npmjs.com/package/validatorjs
 * This validation will be done depending on the registering account type
 * @param {Object} req
 * @param {Object} res
 * @param {function} next
 * @return {*} object
 */
const validateUserCreation = (req, res, next) => {
  // check if businessRegistrationDocumentWas upload and update the document path
  if (req.file) req.body.businessRegistrationDocument = req.file.path

  const { body: reqBody } = req

  const accountTypes = {
    [helpers.constants.SELLER]: true,
    [helpers.constants.BUYER]: true,
    [helpers.constants.CORPORATE_ADMIN]: true,
    [helpers.constants.SUPER_ADMIN]: true
  }

  const { accountType } = reqBody

  //  let us check if accountType is set and exists in our defined accountTypes
  if (!accountType || (!accountTypes[accountType])) {
    //  if validation fails remove file
    if (req.body.businessRegistrationDocument) {
      helpers.removeFile(req.body.businessRegistrationDocument)
    }
    return res.send({
      success: false,
      message: 'Validation failed',
      data: { errors: { accountType: ['Invalid account type'] } }
    })
      .status(400)
  }

  //  if email is not defined set an empty string
  if (!reqBody.email) reqBody.email = ''

  const buyerRules = {
    accountType: 'required',
    firstName: 'required',
    lastName: 'required',
    email: 'email|exists',
    phoneNumber: [{
      required_if: ['email', ''],
      min: 11,
      max: 11,
      exists: ''
    }],
    password: 'required|min:6'
  }

  const superAdminRules = {
    accountType: 'required',
    firstName: 'required',
    phoneNumber: 'exists'
  }

  const sellerRules = {
    ...buyerRules,
    businessName: 'required|exists',
    businessRegistrationNumber: 'required|exists',
    businessRegistrationDocument: 'required',
    businessAddress: 'required',
    businessProductCategory: 'required',
    businessSellingInOtherWebsite: 'required|boolean',
  }
  //  password is not required when signing up as a seller so we won't validate it
  delete sellerRules.password

  const customMessages = {
    'required_if.phoneNumber': 'Please provide your email or phone number'
  }

  /**
   * Add a new validation rule 'exists' that checks
   * if a value of an attribute already exits in DB
   */

  Validator.registerAsync('exists', (value, requirement, attribute, passes) => {
    req.Models.User.valueExists({ [attribute]: value })
      .then((result) => {
        if (result) {
          passes(false, `The ${attribute} is already in use.`)
        } else {
          passes()
        }
      })
  }, '')

  // return split field name before returning them in error message
  Validator.setAttributeFormatter(attribute => attribute.replace(/([A-Z])/g, ' $1')
    .toLocaleLowerCase())

  let validationRule

  // buyer and corporate_admin uses the same validation rule
  switch (accountType) {
    case helpers.constants.BUYER:
    case helpers.constants.CORPORATE_ADMIN:
      validationRule = buyerRules
      break
    case helpers.constants.SELLER:
      validationRule = sellerRules
      break
    case helpers.constants.SUPER_ADMIN:
      validationRule = superAdminRules
      break
    default:
      validationRule = {}
  }
  reqBody.phoneNumber = null
  //  validation rule depends on the user registering
  const validation = new Validator(reqBody, validationRule, customMessages)

  validation.passes(() => {
    // Validation passed
    next()
  })

  validation.fails(() => {
    res.send({
      success: false,
      message: 'Validation failed',
      data: validation.errors
    })
      .status(400)
    //  if validation fails remove file
    if (req.body.businessRegistrationDocument) {
      helpers.removeFile(req.body.businessRegistrationDocument)
    }
  })
}


module.exports = {
  validateUserCreation
}
