const { constants } = require('../../utils/helpers')
const utils = require('../../utils/helper-functions')
const notificationEvents = require('../../utils/notificationEvents')

const _validateCartCreation = async (req) => {
  const errorMessages = []
  const product = await req.Models.Inventory.findById(req.body.product)
  const currentUser = await req.Models.User.findById(req.body.userId)
  const currentUserCart = await req.Models.Cart.find({ user: req.body.userId })
  const productInstallmentMaxPeriod = product.installmentPercentagePerMonth
    ? product.installmentPercentagePerMonth.length : 0

  /** Confirm that the product is valid for installment if a buyer sets installment. */
  if (productInstallmentMaxPeriod === 0 && req.body.installmentPeriod > 0) {
    errorMessages.push('This product doesn\'t support installment')
  }

  /** Make sure a user can't set installment greater than the products requirement */
  if (productInstallmentMaxPeriod !== 0
    && (req.body.installmentPeriod > productInstallmentMaxPeriod)) {
    errorMessages.push('The installment period cannot be greater than the product installment requirement')
  }

  /**
   * When a user set installment period for a product make sure that
   * user has a cooperative before adding the item to cart
   */
  if (productInstallmentMaxPeriod !== 0
    && req.body.installmentPeriod > 0 && !currentUser.cooperative) {
    errorMessages.push('You must belong to a cooperative before you can purchase a product on installment')
  }

  /**
   * When a user set installment period for a product make sure that
   * the user account status has been approved by cooperative before adding the item to cart
   */
  if (productInstallmentMaxPeriod !== 0
    && req.body.installmentPeriod > 0
    && currentUser.status !== constants.ACCOUNT_STATUS.accepted) {
    errorMessages.push('Your cooperative admin must approve your account before you can purchase a product on installment')
  }


  /**
   * assert that a user can't request quantity greater than product's quantity
   */
  if (req.body.quantity > product.quantity) {
    errorMessages.push('The quantity you\'re requesting exceeds available quantity')
  }

  return !errorMessages.length
    ? Promise.resolve({ product, currentUserCart }) : Promise.reject(errorMessages)
}
const create = (req, res) => {
  _validateCartCreation(req)
    .then(({ product, currentUserCart }) => {
      const subTotal = product.price * req.body.quantity
      const quantity = parseInt(req.body.quantity, 10)

      if (req.body.installmentPeriod && req.body.installmentPeriod > 0) {
        // If the installment period set is 1 month take the value of the first index
        /** our count start from 1 months,
         * i.e percentage value on index 0 of the percentage array is for 1month
         * same logic applies when the installment period is greater than 1.
         * */
        req.body.installmentPercentage = product
          .installmentPercentagePerMonth[req.body.installmentPeriod - 1]
      }
      /**
       * lets's check if the product already exist in cart,
       * then increase the quantity instead of creating a new record
       * */
      const itemInCart = currentUserCart
        .filter(cartItem => cartItem.product.equals(req.body.product))
      if (itemInCart.length) {
        // If the product already exist increase the quantity and recalculate subtotal
        req.Models.Cart.findOne({ user: req.body.userId, product: req.body.product },
          (err, cartItem) => {
            if (err) throw err
            else {
              cartItem.quantity += quantity
              cartItem.subTotal += subTotal
              cartItem.meta = req.body.meta
                ? { ...cartItem.meta, ...JSON.parse(req.body.meta) }
                : cartItem.meta

              // Check if the product installment period changes redo calculations.
              if (req.body.installmentPeriod) {
                const installmentInterest = product.price / 100 * req.body.installmentPercentage
                cartItem.installmentPeriod = req.body.installmentPeriod
                cartItem.installmentPercentage = req.body.installmentPercentage
                cartItem.installmentInterest = installmentInterest
                // add interest for each quantity
                cartItem.installmentTotalRepayment = cartItem.subTotal
                  + (cartItem.installmentInterest * cartItem.quantity)
              }

              cartItem.save((error) => {
                if (error) throw error
                else {
                  return res.send({
                    success: true,
                    message: `Quantity increased by ${quantity}`,
                    data: cartItem
                  }).status(200)
                }
              })
            }
          })
      } else {
        const installmentInterest = product.price / 100 * req.body.installmentPercentage
        req.Models.Cart.create({
          product: req.body.product,
          user: req.body.userId,
          quantity,
          installmentPeriod: req.body.installmentPeriod || undefined,
          installmentPercentage: req.body.installmentPercentage,
          unitPrice: product.price,
          subTotal,
          installmentInterest: installmentInterest || undefined,
          installmentTotalRepayment: req.body.installmentPeriod > 0
            ? subTotal + (installmentInterest * quantity) : undefined,
          meta: req.body.meta ? JSON.parse(req.body.meta) : {},
        }, (err, result) => {
          if (err) {
            throw err
          } else {
            res.send({
              success: true,
              message: 'Moved to cart',
              data: result
            })
              .status(201)
          }
        })
      }
    })
    .catch((errors) => {
      res.status(400)
        .send({
          success: false,
          message: 'Validation failed',
          data: {
            errors: {
              product: errors
            }
          }
        })
    })
}

const reduceCartQuantity = (req, res) => {
  const responsePayload = { success: false, message: 'Validation failed', data: { errors: {} } }
  // A user can't decrement an item that has one quantity
  req.Models.Cart.findOne({ _id: req.params.cart, user: req.body.userId })
    .populate('product')
    .exec((err, cartItem) => {
      if (err) throw err
      if (!cartItem) {
        responsePayload.data.errors.cart = ['The cart item you\'re trying to update does not belong to you']
        return res.status(400).send(responsePayload)
      }

      if (cartItem.quantity === 1) {
        responsePayload.data.errors.cart = ['You can\'t reduce a cart item with 1 quantity']
        return res.status(400).send(responsePayload)
      }

      if (req.body.quantity > cartItem.quantity) {
        responsePayload.data.errors.cart = ['Quantity exceed current cart quantity']
        return res.status(400).send(responsePayload)
      }

      const subTotal = cartItem.unitPrice * req.body.quantity
      cartItem.quantity -= req.body.quantity
      cartItem.subTotal -= subTotal

      // Check if the catt item has installment then redo calculations for total repayment.
      if (cartItem.installmentPeriod) {
        cartItem.installmentTotalRepayment -= subTotal
      }
      cartItem.save((error) => {
        if (error) throw error
        return res.send({
          success: true,
          message: 'Updated Successfully',
          data: cartItem
        }).status(200)
      })
    })
}

const get = (req, res) => {
  const filter = { user: req.body.userId, installmentPeriod: undefined }
  const model = req.Models.Cart.find(filter)
  const select = 'name firstName lastName email avatar businessName'
  model.populate({
    path: 'product',
    populate: { path: 'category seller', select }
  })
  model.populate('user', select)
  model.sort({ createdAt: 'desc' })
  model.exec((err, results) => {
    if (err) throw err

    let totalQuantities = 0
    let subTotal = 0
    if (results && results.length) {
      for (let i = 0; i <= results.length; i += 1) {
        if (results[i]) {
          totalQuantities += results[i].quantity
          subTotal += results[i].subTotal
        }
      }
    }
    res.send({
      success: true,
      message: 'Successfully fetching cart',
      data: {
        totalProduct: results.length,
        totalQuantities,
        subTotal,
        results
      }
    })
  })
}

const getInstallment = async (req, res) => {
  try {
    let filter = utils.queryFilters(req)
    filter = { ...filter, user: req.body.userId, installmentPeriod: { $ne: undefined } }
    const model = req.Models.Cart.find(filter)
    const select = 'name firstName lastName email avatar businessName'
    model.populate({ path: 'product', populate: { path: 'category seller', select } })
    model.populate('user', select)
    model.sort({ createdAt: 'desc' })

    if (req.query.approvalStatus) {
      model.populate({
        path: 'approvalRecord',
        match: { adminApprovalStatus: req.query.approvalStatus }
      })
    } else {
      model.populate('approvalRecord')
    }

    let results = await model

    let totalQuantities = 0
    let installmentTotalRepayment = 0

    // Let's check our query matches the result
    if (req.query.approvalStatus) {
      results = results.filter(result => (result.approvalRecord))
    }

    if (results && results.length) {
      for (let i = 0; i < results.length; i += 1) {
        if (results[i]) {
          totalQuantities += results[i].quantity
          installmentTotalRepayment += results[i].installmentTotalRepayment
        }
      }
    }
    res.send({
      success: true,
      message: 'Successfully fetching installment records in cart',
      data: {
        totalProduct: results.length,
        totalQuantities,
        installmentTotalRepayment,
        results
      }
    })
  } catch (error) {
    res.status(500).send()
    req.log(error)
  }
}

const destroy = (req, res) => {
  req.Models.Cart.findByIdAndDelete(
    req.params.cart, (err, cart) => {
      if (err) throw err
      else {
        res.send({
          status: true,
          message: 'Deleted successfully',
          data: cart
        })
      }
    }
  )
}

const requestApproval = async (req, res) => {
  try {
    const responsePayload = { success: false, message: 'Validation failed', data: { errors: {} } }

    // 0. Get the cart item
    const cart = await req.Models.Cart
      .findById(req.body.cartId)
      .populate({ path: 'user', populate: { path: 'cooperative' } })
      .populate('approvalRecord')
      .populate({ path: 'product', populate: { path: 'category seller' } })

    // 1. confirm the current user owns this cart item
    if (cart.user.toString() === req.authData.userId) {
      responsePayload.data.errors.cart = ['This cart item does not belong to you']
    }

    // 2. confirm that the cart record has installment
    if (!cart.installmentPeriod || cart.installmentPeriod === 0) {
      responsePayload.data.errors.installment = ['Cart item is not an installment item']
    }

    // 3. confirm that this cart record status has not formerly been updated
    if (cart.approvalRecord) {
      responsePayload.data.errors.approval = ['Approval Request already sent for this cart item.']
    }

    // Return errors if any
    if (Object.keys(responsePayload.data.errors).length) {
      return res.status(400).send(responsePayload)
    }

    // 4. create approval record and link approvalRecord to original cart
    const approvalRecord = await req.Models.CartApproval.create({
      cart: cart._id,
      seller: cart.product.seller._id,
      sellerApprovalStatus: 'pending',
      adminApprovalStatus: 'pending',
      sellerApprovalToken: await utils.generateToken()
    })
    cart.approvalRecord = approvalRecord._id
    cart.save()

    // 5. send email to seller and admin
    notificationEvents.emit('installment_cart_approval_mail', { cart, approvalRecord })

    // NOTE: Seller email will contain link for approval, admin will be
    // notified that a customer has requested to by a product
    // on installment but yet to be confirmed by a buyer
    // TOKEN: approval token for each user(admin & seller).
    res.send({
      success: true,
      message: 'Successfully Sent Approval',
      data: { ...cart.toObject(), approvalRecord }
    })
  } catch (error) {
    res.status(500)
      .send({ success: false, message: 'Oops! an error occurred' })
    throw new Error(error)
  }
}

const updateApprovalStatus = async (req, res) => {
  try {
    const responsePayload = { success: false, message: 'Validation failed', data: { errors: {} } }
    // NOTE: admin in this context is either a coorporative or superadmin
    const user = await req.Models.User.findById(req.params.userId)

    // 1. Assert that the user is an admin or a seller that owns the product our user is purchasing
    if (!user || (user.accountType !== constants.SELLER
      && user.accountType !== constants.SUPER_ADMIN
      && user.accountType !== constants.CORPORATE_ADMIN)) {
      responsePayload.data.errors.user = ['Invalid User']
    }

    // 2. Validate the user token,check if it matches our record based
    // on if user is a seller or admin
    const tokenKey = user.accountType === constants.SELLER ? 'sellerApprovalToken' : 'adminApprovalToken'
    const approvalRecord = await req.Models.CartApproval
      .findOne({ [tokenKey]: req.params.token })
      .populate({
        path: 'cart',
        populate: { path: 'user product' }
      })
      .populate('seller')
    if (!approvalRecord) {
      responsePayload.data.errors.user = ['Invalid token supplied, or token has been used.']
      return res.status(400).send(responsePayload)
    }

    // validate that the seller owns this product
    if (user.accountType === constants.SELLER
      && user._id.toString() !== approvalRecord.seller._id.toString()) {
      responsePayload.data.errors.user = ['You are not authorised to update this record status']
      return res.status(400).send(responsePayload)
    }

    // when the user accountType is cooperative assert that our customer belongs to this cooperative
    if (user.accountType === constants.CORPORATE_ADMIN
      && user._id.toString() !== approvalRecord.cart.user.cooperative) {
      responsePayload.data.errors.user = ['The customer doesn\'t belong to your cooperative']
      return res.status(400).send(responsePayload)
    }

    // if the user is an admin, validate that this
    // approval request has not already been approved by the seller
    if ((user.accountType === constants.SUPER_ADMIN
      || user.accountType === constants.CORPORATE_ADMIN)
      && approvalRecord.sellerApprovalStatus === 'pending') {
      responsePayload.data.errors.user = ['This record is still pending approval from the seller']
      return res.status(400).send(responsePayload)
    }

    if ((user.accountType === constants.SUPER_ADMIN
      || user.accountType === constants.CORPORATE_ADMIN)
      && approvalRecord.sellerApprovalStatus === 'declined') {
      responsePayload.data.errors.user = ['This record has already been declined by the seller']
      return res.status(400).send(responsePayload)
    }

    // 3. Assert that the user supplied a valid status i.e accept or declined
    if (req.params.status !== constants.ORDER_STATUS.approved
      && req.params.status !== constants.ORDER_STATUS.declined) {
      responsePayload.data.errors.user = ['Invalid status supplied.']
      return res.status(400).send(responsePayload)
    }

    // 4. Update the approval status accordingly depending on if the user is an admin or seller
    const statusKey = user.accountType === constants.SELLER
      ? 'sellerApprovalStatus' : 'adminApprovalStatus'

    // Set the new status value
    approvalRecord[statusKey] = req.params.status

    // Set the auth token for this record to null (based one admin or seller)
    approvalRecord[tokenKey] = null
    if (statusKey === 'sellerApprovalStatus') {
      approvalRecord.sellerApprovalStatusChangeDate = Date.now()
    } else {
      approvalRecord.adminApprovalStatusChangeDate = Date.now()
      approvalRecord.adminApprovalStatusChangedBy = user._id
    }

    // 1. If the user is a seller and the status is decline, notify the customer and admin.
    if (user.accountType === constants.SELLER
      && req.params.status === constants.ORDER_STATUS.declined) {
      // If a seller declines a request automatically decline admin status also
      approvalRecord.adminApprovalStatus = req.params.status
      notificationEvents.emit('seller_installment_cart_declined', approvalRecord)
    }

    // 2. If the user is a seller and the status is approved, generate admin approval token
    // and notify admin of the status update
    if (user.accountType === constants.SELLER
      && req.params.status === constants.ORDER_STATUS.approved) {
      approvalRecord.adminApprovalToken = await utils.generateToken()
      notificationEvents.emit('installment_cart_approval_request_admin', approvalRecord)
    }

    // 3. If the user is an admin and the status is approved.
    //    * Notify the seller of new status from admin
    //    * Notify the customer that they can checkout the installment order
    if ((user.accountType === constants.SUPER_ADMIN
      || user.accountType === constants.CORPORATE_ADMIN)
      && req.params.status === constants.ORDER_STATUS.approved) {
      notificationEvents.emit('installment_cart_admin_approved', approvalRecord)
    }

    // 4. If the user is an admin and the status is declined, notify the customer
    // and seller of the status change
    if ((user.accountType === constants.SUPER_ADMIN
      || user.accountType === constants.CORPORATE_ADMIN)
      && req.params.status === constants.ORDER_STATUS.declined) {
      notificationEvents.emit('installment_cart_admin_declined', approvalRecord)
    }

    // Save all changes
    approvalRecord.save()
    res.send({ success: true, message: 'Successfully updated', data: approvalRecord })
  } catch (error) {
    res.status(500)
      .send({ success: false, message: 'Oops! an error occurred' })
    req.log(error)
  }
}

module.exports = {
  create,
  get,
  destroy,
  reduceCartQuantity,
  getInstallment,
  requestApproval,
  updateApprovalStatus
}
