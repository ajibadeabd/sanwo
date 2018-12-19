const Validator = require('validatorjs')
const Models = require('./../models')
const helpers = require('./../functions/helpers')

// register validation rules
const mongoRegex = /^[a-f\d]{24}$/i

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/

Validator.register('valid_status', value => (!!helpers.constants.ACCOUNT_STATUS[value]),
  'The specified status is invalid')

Validator.register('valid_order_status', value => (!!helpers.constants.ORDER_STATUS[value]),
  'The specified status is invalid')

// validate MongoDB ObjectID
Validator.register('mongoId', value => mongoRegex.test(value),
  'Invalid data sent for :attribute')

// validate Password policy
Validator.register('password_policy', value => passwordRegex.test(value),
  'Minimum six characters, at least one uppercase letter, one lowercase letter, one number and one special character')

// checks if a the attribute value exists it the specified DB
Validator.registerAsync('exists', (value, requirement, attribute, passes) => {
  if (!requirement) throw new Error('Specify Requirements i.e fieldName: exists:table,column')
  const splitReq = requirement.split(',')

  if (splitReq.length !== 2) throw new Error(`Invalid format for validation rule on ${attribute}`)

  const { 0: table, 1: column } = splitReq
  if (!Models[table]) throw new Error('The specified table name doesn\'t exists')

  let msg = ''

  // if a column is specified user the column instead of the attribute
  // let's check it the specified column is a valid mongodObject id
  if (column === '_id' && !(mongoRegex.test(value))) {
    passes(false, msg)
    return
  }
  // when id is specified as column, we are checking if the record exist
  msg = (column === '_id')
    ? `The ${attribute} does not exist` : `The ${attribute} is already in use.`

  Models[table].valueExists({ [column]: value })
    .then((result) => {
      // if we are checking for an id and the result isn't found return
      if (!result && column === '_id') {
        passes(false, msg)
        return
      }
      if (result && column === '_id') {
        passes()
        return
      }

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

const validator = (body, rules, customMessages, callback) => {
  const validation = new Validator(body, rules, customMessages)

  validation.passes(() => callback(null, true))

  validation.fails(() => callback(validation.errors, false))
}

module.exports = validator