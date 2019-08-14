const utils = require('../../utils/helper-functions')

const create = async (req, res) => {
  const result = await req.Models.Rating.create({
    product: req.body.product,
    user: req.body.userId,
    rating: req.body.rating,
    review: req.body.review
  })
  res.send({ success: true, message: 'Created Successfully', data: result })
}

const get = async (req, res) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10
  const filter = utils.queryFilters(req)
  const model = req.Models.Rating.find(filter)
  model.populate('user', '-password')
  model.populate('product', 'name description')
  model.skip(offset)
  model.limit(limit)
  const results = await model
  res.send({
    success: true,
    message: 'Successfully fetching categories',
    data: {
      offset,
      limit,
      resultCount: results.length,
      results
    }
  })
}

const destroy = async (req, res) => {
  const rating = await req.Models.Rating.findByIdAndDelete(req.params.id)
  res.send({ status: true, message: 'Deleted successfully', data: rating })
}

module.exports = {
  create,
  get,
  destroy
}
