const utils = require('../../utils/helper-functions')

const createCategory = async (req, res) => {
  try {
    const categoryName = req.body.name
    const category = await req.Models.Category.create({
      name: categoryName,
      slug: req.body.slug || categoryName.toLowerCase().replace(/\s/ig, '-'),
      description: req.body.description,
      icon: req.body.icon
    })

    // If a parent is specified let's get the record, and apend the child
    if (req.body.parent) {
      const { parent } = req.body
      const parentCategory = await req.Models.Category.findById(parent)
      parentCategory.children.unshift(category._id)
      parentCategory.save()
      category.parent = parent
      category.save()

      category.parent = parentCategory
    }

    res.send({ success: true, message: 'Created Successfully', data: category })
  } catch (e) {
    res.status(500).send({ success: false, message: e.message })
  }
}

const getCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10
    const offset = parseInt(req.query.offset, 10) || 0
    const filter = utils.queryFilters(req)
    if (req.query.name) filter.name = { $regex: filter.name, $options: 'i' }
    const resultCount = await req.Models.Category.countDocuments(filter)
    const results = await req.Models.Category.find(filter)
      .populate('parent')
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: 'desc' })

    res.send({
      success: true,
      message: 'Successfully fetching categories',
      data: {
        offset, limit, resultCount, results
      }
    })
  } catch (e) {
    res.status(500)
      .send({
        success: false,
        message: e.message
      })
  }
}

const getGroupedCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10
    const offset = parseInt(req.query.offset, 10) || 0
    const filter = utils.queryFilters(req)
    filter.parent = null
    const resultCount = await req.Models.Category.countDocuments(filter)

    const results = await req.Models.Category.find(filter)
      .populate({
        path: 'children',
        populate: { path: 'children', populate: { path: 'children', } }
      })
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: 'desc' })

    res.send({
      success: true,
      message: 'Successfully fetching categories',
      data: {
        offset, limit, resultCount, results
      }
    })
  } catch (e) {
    res.status(500)
      .send({
        success: false,
        message: e.message
      })
  }
}

const updateCategory = async (req, res) => {
  try {
    const category = await req.Models.Category.findOne({ _id: req.params.category })
    category.name = req.body.name || category.name
    category.description = req.body.description || category.description
    category.icon = req.body.icon || category.icon

    if (req.body.child) {
      // check if child already  exist
      const childExist = category.children.some(child => child.toString() === req.body.child)
      if (childExist) {
        return res.status(400).send({
          success: false,
          message: 'The category you\'re trying to update already has the specified child already.',
        })
      }
      category.children.unshift(req.body.child)
    }

    if (req.body.parent) {
      if (category.parent) {
        return res.status(400).send({
          success: false,
          message: 'The category you\'re trying to update has a parent, remove the parent before adding a new one',
        })
      }

      const parentCategory = await req.Models.Category.findOne({ _id: req.body.parent })

      // check that the specified parent doesn't already have this category as child
      const childExist = parentCategory.children
        .some(child => child.toString() === req.body.child)
      if (childExist.length) {
        return res.status(400).send({
          success: false,
          message: 'The parent category already have this category as child',
        })
      }
      parentCategory.children.unshift(category._id)
      parentCategory.save()

      category.parent = parentCategory._id
    }


    category.save()

    res.send({
      success: true,
      message: 'Updated Successfully',
      data: category
    })
  } catch (e) {
    res.status(500).send({ success: false, message: e.message })
  }
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

const removeParentCategory = async (req, res) => {
  const parentCategory = await req.Models.Category.findById(req.body.parent)
  const childCategory = await req.Models.Category.findById(req.body.child)

  if (!childCategory.parent) {
    return res.status(400).send({
      success: false,
      message: 'The specified child does not have a parent',
    })
  }

  if (parentCategory._id.toString() !== childCategory.parent.toString()) {
    return res.status(400)
      .send({
        success: false,
        message: 'Parent category specified does not match child parent',
      })
  }
  parentCategory.children = parentCategory.children
    .filter(child => child.toString() !== childCategory._id.toString())
  parentCategory.save()

  childCategory.parent = undefined
  childCategory.save()

  res.send({
    status: true,
    message: 'Category relationship removed',
    data: {
      parentCategory,
      childCategory
    }
  })
}

module.exports = {
  createCategory,
  getCategories,
  getGroupedCategories,
  updateCategory,
  destroyCategory,
  removeParentCategory
}
