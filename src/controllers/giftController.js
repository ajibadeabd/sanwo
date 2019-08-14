const crypto = require('crypto')


const createGift = (req, res) => {
  crypto.randomBytes(10, (err, buffer) => {
    if (err) throw err
    const token = buffer.toString('hex')
    req.Models.Gift.create({
      cardHash: token,
      price: req.body.price,
      createDate: Date.now()
    })
  }, (err, result) => {
    if (err) throw err

    else {
      res.json({
        status: 'success',
        message: 'Gift Card Created Successfully',
        data: result
      })
    }
  })
}

// check if gift card is valid
const auth = (req, res) => {
  const { cardHash } = req.body
  req.Models.Gift.findOne({ cardHash }, (err, order) => {
    if (err) throw err
    if ((req.body.cardHash !== order.cardHash)) {
      res.json({
        status: 'error',
        message: 'Invalid Gift Card',
        data: null
      })
    } else {
      res.send({
        status: 'Success',
        message: 'Valid token',
        data: order
      })
    }
  })
}

const del = (req, res) => {
  req.Models.Gift.findByIdAndDelete(
    req.params.GiftId, (err, giftCardInfo) => {
      if (err) throw err
      else {
        res.json({
          status: 'success',
          message: 'Deleted successfully',
          data: giftCardInfo
        })
      }
    }
  )
}


module.exports = {
  createGift, auth, del
}