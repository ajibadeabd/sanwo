const Validator = require('./../functions/Validator')

const create = (req, res, next) => {

  if (!req.body.slug || req.body.slug.replace(/\s/,'') === ''){
    req.body.slug = ''
  }
  const validationRule = {
    name: 'required|exists:Category,name',
    slug: 'exists:Category,slug',
    installmentPeriod: 'numeric|min:0',
    description: 'string',
  }

  Validator(req.body, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    } else {
      next()
    }
  })
}

const update = (req, res, next) => {
  const reqBody = {...req.body, ...req.params}
  if (!req.body.slug || req.body.slug.replace(/\s/,'') === ''){
    req.body.slug = ''
  }
  const validationRule = {
    category: 'required|mongoId|exists:Category,_id',
    name: 'required',
    slug: 'exists:Category,slug',
    installmentPeriod: 'numeric|min:0',
    description: 'string',
  }

  Validator(reqBody, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    } else {
      next()
    }
  })
}

const deleteCategory = (req, res, next) => {
  const validationRule = { category: 'required|mongoId|exists:Category,_id' }
  Validator(req.params, validationRule, {}, (err, status) => {
    if (!status) {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: err
        })
    } else {
      next()
    }
  })
}

module.exports = {
  create,
  update,
  deleteCategory
}
