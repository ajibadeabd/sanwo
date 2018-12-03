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
    email: 'email|exists:email',
    phoneNumber: [{
      required_if: ['email', ''],
      min: 11,
      max: 11,
      exists: 'phoneNumber'
    }],
    cooperative: [{ mongoId: '', exists: '_id' }],
    password: 'required|min:6'
  }

  const superAdminRules = {
    accountType: 'required',
    name: 'required',
    email: 'exists:email'
  }

  const sellerRules = {
    ...buyerRules,
    businessName: 'required|exists:businessName',
    businessRegistrationNumber: 'required|exists:businessRegistrationNumber',
    businessRegistrationDocument: 'required',
    businessAddress: 'required',
    businessProductCategory: 'required',
    businessSellingInOtherWebsite: 'required|boolean',
  }
  //  password is not required when signing up as a seller so we won't validate it
  delete sellerRules.password

  const customMessages = {
    'required_if.phoneNumber': 'Please provide your email or phone number',
    'exists.cooperative': 'Specified cooperative doesn\'t not exits'
  }

  Validator.register('mongoId', value => /^[a-f\d]{24}$/i.test(value),
    'Invalid data sent for :attribute')

  /**
   * Add a new validation rule 'exists' that checks
   * if a value of an attribute already exits in DB
   */
  Validator.registerAsync('exists', (value, requirement, attribute, passes) => {
    let msg = ''
    // if a column is specified user the column instead of the attribute

    // let's check it the specified column is a valid mongodObject id
    if (requirement === '_id' && !(/^[a-f\d]{24}$/i.test(value))) {
      passes(false, msg)
      return
    }
    // when id is specified as requirement, we are checking if the record exist
    msg = (requirement === '_id')
      ? `The ${attribute} does not exist` : `The ${attribute} is already in use.`

    req.Models.User.valueExists({ [requirement]: value })
      .then((result) => {
        if (result) {
          passes(false, msg)
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
