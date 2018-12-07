<<<<<<< HEAD
const helpers = require('./../functions/mailhelpers')

=======
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194

const create = (req, res) => {
  req.Models.Order.create({
    orderDate: req.body.orderDate,
    orderStatus: req.body.orderStatus,
    trackOrder: req.body.trackOrder,
    quantity: req.body.quantity,
    orderPrice: req.body.orderPrice * req.body.quantity,
    product: req.body.product,
    instNumber: req.body.orderPrice * req.body.quantity / req.body.instNumber
  }, (err, result) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Order Created Successfully',
        data: result
<<<<<<< HEAD
      }).status(201)
      helpers.sendOrderMail(result, req)
=======
      })
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194
    }
  })
}

const getOrder = (req, res) => {
  req.Models.Order.find({}, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'All orders',
        data: orderInfo
      })
    }
  }).sort({ orderDate: -1 })
}

<<<<<<< HEAD
const putorder = (req, res) => {
req.Models.Order.findByIdAndUpdate(
  req.params.orderid, (err,orderInfo) => {
    if(err) throw new Error('Update Failed')
    else {
      res.json({
        status: 'success',
        message: 'Update successful',
        data: orderInfo
      })
    }
  }
)
}

const getDisbursedStock = (req, res) => {
  req.Models.Order.find({
    $and: [{ orderStatus: 'Shipped' },
      // { orderPrice: req.body.orderPrice * req.body.quantity }
    ]
  }, (err, orderInfo) => {
=======
const putOrder = (req, res) => {
  req.Models.Order.findByIdAndUpdate({
    orderDate: req.body.orderDate,
    orderStatus: req.body.orderStatus,
    trackOrder: req.body.trackOrder,
    quantity: req.body.quantity,
    orderPrice: req.body.orderPrice * req.body.quantity,
    product: req.body.product

  }, (err, result) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Order Added successfully',
        data: result
      })
    }
  })
}

const getDisbursedStock = (req, res) => {
  req.Models.Order.find({ $and: [{ orderStatus: 'Shipped' }, 
  { orderPrice: req.body.orderPrice * req.body.quantity }] }, (err, orderInfo) => {
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Disbursed Stock and Price',
        data: orderInfo
      })
    }
  })
}

const purchasedStock = (req, res) => {
<<<<<<< HEAD
  req.Models.Order.find({
    $and: [{ orderStatus: 'Awaiting' },
      // { orderPrice: req.body.orderPrice * req.body.quantity }
    ]
  }, (err, orderInfo) => {
=======
  req.Models.Order.find({ $and: [{ orderStatus: 'Awaiting' }, 
  { orderPrice: req.body.orderPrice * req.body.quantity }] }, (err, orderInfo) => {
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Purchased Stock',
        data: orderInfo
      })
    }
  })
}

<<<<<<< HEAD
//Brings out the list of orders shipped but not delivered
const inProcess = (req, res) => {
  req.Models.Order.find({
    $and: [{ orderStatus: 'Shipped' },
      { trackOrder: 'Not Delivered' }
    ]
  }, (err, orderInfo) => {
=======
const inProcess = (req, res) => {
  req.Models.Order.find({ $and: [{ orderStatus: 'Shipped' }, 
  { trackOrder: 'Not Delivered' }] }, (err, orderInfo) => {
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Orders In Process',
        data: orderInfo
      })
    }
  })
}

<<<<<<< HEAD
// List of the shipped stock
=======
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194
const shipped = (req, res) => {
  req.Models.Order.find({ $and: [{ orderStatus: 'Shipped' }] }, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Shipped Stock',
        data: orderInfo
      })
    }
  })
}

const del = (req, res) => {
  req.Models.Order.findByIdAndDelete(
<<<<<<< HEAD
    req.params.orderid, (err, orderInfo) => {
=======
    req.params.OrderId, (err, orderInfo) => {
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194
      if (err) throw err
      else {
        res.json({
          status: 'success',
          message: 'Deleted successfully',
          data: orderInfo
        })
      }
    }
  )
}

<<<<<<< HEAD
const shippedItem = (req, res) => {
  req.Models.Order.find({ $and: [{ orderStatus: 'Shipped' }, { trackOrder: 'Delivered' }] }, (err, orderInfo) => {
    if (err) throw err
    else {
      res.json({
        status: 'success',
        message: 'Transaction Complete',
        data: orderInfo
      }).status(201)
      
    }
  })
}

=======
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194

module.exports = {
  create,
  getOrder,
  getDisbursedStock,
  putOrder,
  purchasedStock,
  inProcess,
  shipped,
<<<<<<< HEAD
  del,
  shippedItem
=======
  del
>>>>>>> 7e055b6c998483f2c3607422c0be90fd549a8194
}