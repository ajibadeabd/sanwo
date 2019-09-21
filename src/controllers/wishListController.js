const createWishList = (req, res) => {
  req.Models.WishList.create({
    product: req.body.product,
    user: req.body.userId,
    description: req.body.description,
  }, (err, result) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Moved to wish list',
        data: result
      })
        .status(201)
    }
  })
}

const getWishList = (req, res) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10
  const model = req.Models.WishList.find({ user: req.body.userId })
  const select = 'name firstName lastName email avatar businessName'
  model.skip(offset)
  model.limit(limit)
  model.populate({
    path: 'product category',
    populate: { path: 'category seller', select }
  })
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching wish-lists',
        data: {
          offset,
          limit,
          resultCount: results.length,
          results
        }
      })
    }
  })
}

const destroyWishList = (req, res) => {
  req.Models.WishList.findByIdAndDelete(
    req.params.id, (err, WishList) => {
      if (err) throw err
      else {
        res.send({
          status: true,
          message: 'Deleted successfully',
          data: WishList
        })
      }
    }
  )
}

module.exports = {
  createWishList,
  getWishList,
  destroyWishList
}
