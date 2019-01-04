const utils = require('../../utils/helper-functions')
const createCategory = (req, res)=>{
  const categoryName = req.body.name;
  req.Models.Category.create({
    name: categoryName,
    slug: req.body.slug || categoryName.toLowerCase().replace(/\s/ig,'-'),
    installmentPeriod: req.body.installmentPeriod || 0,
    description: req.body.description,
    categoryImage: req.body.categoryImage,
  }, (err, result) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Created Successfully',
        data: result
      })
        .status(201)
    }
  })
}

const getCategories = (req, res) => {
  let limit = parseInt(req.query.limit)
  let offset = parseInt(req.query.offset)
  offset = offset || 0
  limit = limit || 10
  const filter = utils.queryFilters(req)
  const model = req.Models.Category.find(filter)
  model.skip(offset)
  model.limit(limit)
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
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
  })
}

const updateCategory = (req, res) => {
  req.Models.Category.findOne({ _id: req.params.category })
    .exec((err, category) => {
      if (err) {
        throw err
      } else {
        category.name = req.body.name || category.name
        category.description = req.body.description || category.description
        category.installmentPeriod = req.body.installmentPeriod || category.installmentPeriod

        category.save((error) => {
          if (error) throw error
          return res.send({
            success: true,
            message: 'Updated Successfully',
            data: category
          })
        })
      }
    })
}

const destroyCategory = (req, res) => {
  req.Models.Category.findByIdAndDelete(
    req.params.category, (err, Category) => {
      if (err) throw err
      else {
        res.send({
          status: true,
          message: 'Deleted successfully',
          data: Category
        })
      }
    }
  )

}

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  destroyCategory
}
