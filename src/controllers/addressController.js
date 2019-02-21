const utils = require('../../utils/helper-functions')

const create = async (req, res) => {
  const currentUser = await req.Models.User.findOne({ _id: req.body.userId })
  req.Models.AddressBook.create({
    user: currentUser._id,
    firstName: req.body.firstName || currentUser.firstName,
    lastName: req.body.lastName || currentUser.lastName,
    phoneNumber: req.body.phoneNumber || currentUser.phoneNumber,
    address: req.body.address,
    additionalInfo: req.body.additionalInfo,
    region: req.body.region,
    city: req.body.city,
  },
  (err, result) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Address Created Successfully',
        data: result
      })
        .status(201)
    }
  })
}

const get = (req, res) => {
  let limit = parseInt(req.query.limit, 10)
  let offset = parseInt(req.query.offset, 10)
  offset = offset || 0
  limit = limit || 10
  const filter = utils.queryFilters(req)
  filter.user = req.body.userId
  const model = req.Models.AddressBook.find(filter)
  model.populate('user', 'avatar firstName lastName email phoneNumber')
  model.skip(offset)
  model.limit(limit)
  model.exec((err, results) => {
    if (err) {
      throw err
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching addressBooks',
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

const update = (req, res) => {
  req.Models.AddressBook.findOne({ user: req.body.userId, _id: req.params.id })
    .exec((err, addressBook) => {
      if (err) {
        throw err
      } else {
        if (!addressBook) {
          return res.send({
            success: true,
            message: 'Unauthorized! you don\'t own this record',
            data: addressBook
          }).status(401)
        }
        addressBook.firstName = req.body.firstName || addressBook.firstName
        addressBook.lastName = req.body.lastName || addressBook.lastName
        addressBook.phoneNumber = req.body.phoneNumber || addressBook.phoneNumber
        addressBook.address = req.body.address || addressBook.address
        addressBook.additionalInfo = req.body.additionalInfo || addressBook.additionalInfo
        addressBook.region = req.body.region || addressBook.region
        addressBook.city = req.body.city || addressBook.city

        addressBook.save((error) => {
          if (error) throw error
          return res.send({
            success: true,
            message: 'Updated Successfully',
            data: addressBook
          })
        })
      }
    })
}

const destroy = (req, res) => {
  req.Models.AddressBook.findOneAndDelete({ user: req.body.userId, _id: req.params.id },
    (err, AddressBook) => {
      if (err) throw err
      else {
        res.send({
          status: true,
          message: 'Deleted successfully',
          data: AddressBook
        })
      }
    })
}

module.exports = {
  create,
  get,
  update,
  destroy
}
