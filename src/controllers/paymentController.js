const sha512 = require("crypto-js/sha512");
const helpers = require("../../utils/helpers");
const utils = require("../../utils/helper-functions");
const { _generateRRR, _getRRRStatus } = require("../../utils/remitaServices");
const events = require("../../utils/notificationEvents");
const models = require("./../models");
const { createWalletRecord } = require("../controllers/walletController");
const remitaServices = require("../../utils/remitaServices");
const notificationEvents = require("../../utils/notificationEvents");

// TODO replace with correct valid credentials
const { remitaConfig, constants } = helpers;
// const theApiHash = sha512(`${remitaConfig.merchantId}230007734065${remitaConfig.apiKey}`)
// console.log(theApiHash.toString())

const _getAndUpdatePaymentStatus = async payment => {
  try {
    const { merchantId, apiKey } = remitaConfig;
    const { transactionRef } = payment;
    const apiHash = sha512(`${transactionRef}${apiKey}${merchantId}`);
    const remitaResponse = await _getRRRStatus(transactionRef, apiHash);

    const oldStatus = payment.status;
    const paymentConst = helpers.constants.PAYMENT_STATUS;
    const payStatus = Object.keys(paymentConst)[
      Object.values(paymentConst).indexOf(remitaResponse.status)
    ];

    // If the status as the old value don't continue process must have been done before
    if (payStatus && oldStatus !== remitaResponse.status) {
      payment.status = remitaResponse.status || "/unknown-status";
      payment.meta = { ...remitaResponse, ...payment.meta };
      payment.updatedAt = Date.now();
      payment.save();

      let newOrderStatus = "";
      // If a payment status is not 00(success), 01(approve) or 021(pending) then payment failed
      switch (remitaResponse.status) {
        case "00":
          newOrderStatus = helpers.constants.ORDER_STATUS.payment_completed;
          break;
        case "01":
          newOrderStatus = helpers.constants.ORDER_STATUS.payment_completed;
          break;
        case "021":
          newOrderStatus = helpers.constants.ORDER_STATUS.pending_payment;
          break;
        default:
          newOrderStatus = helpers.constants.ORDER_STATUS.payment_failed;
      }
      // update order status
      payment.order.orderStatus = newOrderStatus;
      payment.order.updatedAt = Date.now();
      payment.order.save();

      // Update status of all purchases and notify sellers
      const { purchases } = payment.order;
      const purchaseIds = purchases.map(purchase => purchase._id);
      const sellerEmails = purchases.map(purchase => purchase.seller.email);
      await models.Purchase.updateMany(
        { _id: { $in: purchaseIds } },
        { status: newOrderStatus }
      );

      // If the payment completed successfully, credit the sellers wallet
      if (newOrderStatus === helpers.constants.ORDER_STATUS.payment_completed) {
        const walletRecords = purchases.map(purchase => ({
          seller: purchase.seller._id,
          order: payment.order._id,
          paymentRecord: payment._id,
          purchase: purchase._id,
          status: helpers.constants.WALLET_STATUS.payment_confirmed,
          amount: purchase.subTotal
        }));
        await createWalletRecord(walletRecords);
      }

      // If payment is still pending no need notifying the user that their payment is pending
      if (newOrderStatus !== helpers.constants.ORDER_STATUS.pending_payment) {
        events.emit(
          "payment_status_changed",
          { order: payment.order, buyer: payment.user, sellerEmails },
          payStatus.replace(/_/g, " ").toUpperCase()
        );
      }

      // TODO Split payment to sellers wallet accordingly once payment is complete
    }
    return Promise.resolve(payment);
  } catch (error) {
    return Promise.reject(error);
  }
};

const generateOrderPaymentRRR = async (req, res) => {
  try {
    /** Whispers: "Be the best you can be" * */

    // first we get the order record with the passed orderNumber
    const order = await req.Models.Order.findOne({
      orderNumber: req.body.orderNumber
    }).populate("payment");
    if (!order) {
      // if the record isn't found let the user know order doesn't exit.
      return res
        .send({
          success: false,
          message: "Order does not exist",
          data: {}
        })
        .status(400);
    }

    // assert that the belongs to the current user
    const userOrder = await await req.Models.Order.findOne({
      orderNumber: req.body.orderNumber,
      buyer: req.body.userId
    }).populate("buyer purchases");
    if (!userOrder) {
      // if the record isn't found let the user know they don't own the order.
      return res
        .send({
          success: false,
          message:
            "You don't own the order you're trying to make payment for, please login as the right user",
          data: {}
        })
        .status(400);
    }

    if (userOrder.installmentPeriod) {
      return res
        .send({
          success: false,
          message: "You can't generate RRR for an installment order.",
          data: {}
        })
        .status(400);
    }

    const orderHasCompletedPayment = await req.Models.Payment.findOne({
      order: userOrder._id,
      $or: [
        {
          status:
            helpers.constants.PAYMENT_STATUS.transaction_completed_successfully
        },
        { status: helpers.constants.PAYMENT_STATUS.transaction_approved }
      ]
    });

    // If payment has been completed for this order return proper message
    if (orderHasCompletedPayment) {
      return res
        .send({
          success: false,
          message: "Payment has already been completed for this order",
          data: orderHasCompletedPayment
        })
        .stat(400);
    }

    // If RRR code has been generated for this order and payment is not failed return the RRR
    if (
      order.payment &&
      (order.payment.transactionRef &&
        order.orderStatus !== helpers.constants.ORDER_STATUS.payment_failed)
    ) {
      order.payment.hash = sha512(
        `${remitaConfig.merchantId}${order.payment.transactionRef}${remitaConfig.apiKey}`
      );
      return res.send({
        success: true,
        message: "Successfully generated RRR",
        data: order.payment
      });
    }

    // build remita payload
    const { buyer, purchases } = userOrder;
    const rrrPayload = {
      amount: order.subTotal,
      orderId: `No_${order.orderNumber}`,
      payerName: `${buyer.firstName} ${buyer.lastName}`,
      payerEmail: buyer.email,
      payerPhone: buyer.phoneNumber,
      description: `Payment for ${purchases.length} product(s)`
    };
    // add custom field containing the purchased product details
    rrrPayload.customFields = purchases.map(purchase => ({
      name: purchase.product ? purchase.product.name : "--",
      value: purchase.product
        ? `Price: ${purchase.product.price} - Quantity: ${purchase.quantity} -
      Seller: ${purchase.product.seller.firstName} ${purchase.product.seller.lastName} (${purchase.product.seller.email})`
        : "--",
      type: "ALL"
    }));
    const { merchantId, serviceTypeId, apiKey } = remitaConfig;

    // Generate remita apiHash
    const apiHash = sha512(
      `${merchantId}${serviceTypeId}${rrrPayload.orderId}${rrrPayload.amount}${apiKey}`
    );

    // generate the RRR code and return response accordingly
    const remitaResponse = await _generateRRR(rrrPayload, apiHash);

    if (remitaResponse.RRR) {
      // Create payment record
      const paymentRecord = await req.Models.Payment.create({
        user: buyer._id,
        order: order._id,
        amount: order.subTotal,
        transactionRef: remitaResponse.RRR,
        status: helpers.constants.PAYMENT_STATUS.pending_payment,
        channel: "remita.net",
        meta: remitaResponse,
        hash: sha512(`${merchantId}${remitaResponse.RRR}${apiKey}`)
      });

      // Update the order record with the related payment _id
      order.payment = paymentRecord._id;
      order.save(orderSaveError => {
        if (orderSaveError) throw orderSaveError;
      });
      return res.send({
        success: true,
        message: "Successfully generated RRR",
        data: paymentRecord
      });
    }
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin",
      data: remitaResponse
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin",
      data: {}
    });
    req.log(err);
    throw new Error(err);
  }
};

const getOrderPayments = async (req, res) => {
  const order = await req.Models.Order.findOne({
    orderNumber: req.params.orderNumber
  });
  let limit = parseInt(req.query.limit, 10);
  let offset = parseInt(req.query.offset, 10);
  offset = offset || 0;
  limit = limit || 10;
  let filter = utils.queryFilters(req);
  filter = {
    user: req.body.userId,
    order: order._id,
    ...filter
  };
  const model = req.Models.Payment.find(filter);
  model.skip(offset);
  model.limit(limit);
  model.exec((err, results) => {
    if (err) {
      throw err;
    } else {
      res.send({
        success: true,
        message: "Successfully fetching order payments",
        data: {
          offset,
          limit,
          resultCount: results.length,
          results
        }
      });
    }
  });
};

const getPayment = async (req, res) => {
  try {
    // get payment status, if payment is completed no need to check remita
    const select = "email firstName lastName email";
    const payment = await req.Models.Payment.findById(req.params.paymentId)
      .populate("user", select)
      .populate({
        path: "order",
        populate: { path: "purchases", populate: { path: "seller", select } }
      });

    // If the transaction status is completed return response
    const transactionCompleted =
      helpers.constants.PAYMENT_STATUS.transaction_completed_successfully;
    const transactionApproved =
      helpers.constants.PAYMENT_STATUS.transaction_approved;
    if (
      payment.status === transactionCompleted ||
      payment.status === transactionApproved
    ) {
      return res.send({
        success: true,
        message: "Successfully fetching payment",
        data: payment
      });
    }

    // If otherwise check remita for the latest payment status and update status accordingly
    const updatedPayment = await _getAndUpdatePaymentStatus(payment);

    return res.send({
      success: true,
      message: "Successfully fetching payment",
      data: updatedPayment
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message:
        "Oops! an error occurred. Please retry, if error persist contact admin",
      data: {}
    });
    throw new Error(err);
  }
};

const notification = async (req, res) => {
  try {
    // if transaction already processed return payload as it is
    if (!req.query.RRR) {
      return res.send({
        success: false,
        message: "Invalid RRR/transactionRef",
        data: {}
      });
    }

    if (req.query.statuscode === "027") {
      return res.send({
        success: true,
        message: "Transaction Already Processed ",
        data: {}
      });
    }

    const payment = await req.Models.Payment.findOne({
      transactionRef: req.query.RRR
    })
      .populate("user")
      .populate({ path: "order", populate: { path: "purchases" } });

    const approved = helpers.constants.PAYMENT_STATUS.transaction_approved;
    const completed =
      helpers.constants.PAYMENT_STATUS.transaction_completed_successfully;
    if (
      payment &&
      (payment.status === approved || payment.status === completed)
    ) {
      return res.send({
        success: true,
        message: "Transaction Already Processed ",
        data: {}
      });
    }

    const updatedPayment = await _getAndUpdatePaymentStatus(payment);
    res.send({
      success: true,
      message: "Payment Processing Completed",
      data: updatedPayment
    });
    // do remaining payment status change operation
  } catch (err) {
    res
      .send({
        success: false,
        message:
          "Oops! an error occurred. Please retry, if error persist contact admin",
        data: {}
      })
      .status(500);
    throw new Error(err);
  }
};

const installmentMandateStatus = async (req, res) => {
  try {
    const select = "email firstName lastName email";
    if (req.params.orderId.length > 10) {
      const order = await req.Models.Order.findOne({
        _id: req.params.orderId
      })
        .populate("buyer")
        .populate({ path: "purchases", populate: { path: "seller", select } });
    } else {
      const order = await req.Models.Order.findOne({
        orderNumber: req.params.orderId
      })
        .populate("buyer")
        .populate({ path: "purchases", populate: { path: "seller", select } });
    }

    const mandateStatus = await remitaServices._mandateStatus(
      order.orderNumber
    );
    mandateStatus.isActive = true;
    res.send({
      success: true,
      message: "Mandate Status",
      data: mandateStatus
    });
    order.installmentPaymentMandate.status = mandateStatus.isActive;
    order.save();

    // If the mandate status changes update DB
    if (
      mandateStatus.isActive &&
      mandateStatus.isActive !== order.installmentPaymentMandate.status
    ) {
      const purchase = order.purchases[0];
      order.installmentPaymentMandate.status = mandateStatus.isActive;
      order.installmentPaymentMandate.statusChangeDate = Date.now();
      order.save();

      const status = constants.ORDER_STATUS.approved;
      purchase.status = status;
      purchase.save();
      // send mail to seller and customer
      notificationEvents.emit("purchase_status_changed", {
        order,
        status,
        purchase
      });
    }
  } catch (e) {
    res.status(500).send({
      success: false,
      message: e.message
    });
  }
};

const installmentPaymentHistory = async (req, res) => {
  try {
    const order = await req.Models.Order.findById(req.params.orderId);

    const body = {
      merchantId: remitaConfig.merchantId,
      mandateId: order.installmentPaymentMandate.mandateId,
      requestId: order.installmentPaymentMandate.requestId
    };
    const history = await remitaServices._mandatePaymentHistory(body);
    res.send({
      success: true,
      message: "Mandate Payment History",
      data: history
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message: e.message
    });
  }
};

const debitNotification = async (req, res) => {
  try {
    const responseBody = req.body;
    if (!responseBody.length)
      return res
        .status(400)
        .send({ status: false, message: "Empty request body" });
    const debitItem = responseBody.lineItems[0];
    const select = "email firstName lastName email";
    const order = await req.Models.Order.findOne({
      orderNumber: debitItem.requestId
    })
      .populate({ path: "buyer", populate: { path: "cooperative", select } })
      .populate("purchases");
    const pendingPayments = order.installmentsRepaymentSchedule.filter(
      paymentSchedule => paymentSchedule.status === "pending"
    );

    res.send({ status: true, message: "OK" });

    if (pendingPayments.length) {
      pendingPayments[0].status = "transaction_completed_successfully";
      pendingPayments[0].datePaid = debitItem.debitDate;
      pendingPayments[0].meta = responseBody;
      order.save();
      // TODO Create payment and wallet record
      notificationEvents.emit("installment_payment_debit", {
        order,
        payment: debitItem
      });
    }
    if (pendingPayments.length === 0 || pendingPayments.length === 1) {
      order.installmentPaymentStatus = "completed";
      order.save();
      notificationEvents.emit("installment_payment_completed", {
        order,
        payment: debitItem
      });
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateOrderPaymentRRR,
  getOrderPayments,
  getPayment,
  notification,
  installmentMandateStatus,
  installmentPaymentHistory,
  debitNotification
};
