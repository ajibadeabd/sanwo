/* eslint-disable require-jsdoc */
const request = require("request-promise");
const sha512 = require("crypto-js/sha512");

// TODO replace with correct valid credentials
const remitaConfig = {
  baseUrl: "https://login.remita.net/remita",
  serviceTypeId: "2890253712",
  apiKey: "UEFZU01PU01PMTIzNHxQQVlTTU9TTU8=",
  merchantId: "3699574570"
};

// Remita JSONP padding ishh
const jsonp = json => json;

const _generateRRR = async (payload, apiHash) => {
  try {
    const { merchantId, serviceTypeId } = remitaConfig;
    payload = { ...payload, serviceTypeId };
    const options = {
      method: "POST",
      uri: `${remitaConfig.baseUrl}/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit`,
      body: payload,
      json: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`
      }
    };
    const response = await request(options);
    return Promise.resolve(response);
  } catch (error) {
    return Promise.reject(error);
  }
};

const _getRRRStatus = async (rrr, apiHash) => {
  try {
    const { merchantId } = remitaConfig;
    const options = {
      method: "GET",
      uri: `${remitaConfig.baseUrl}/ecomm/${merchantId}/${rrr}/${apiHash}/status.reg`,
      json: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`
      }
    };
    const response = await request(options);
    return Promise.resolve(response);
  } catch (error) {
    return Promise.reject(error);
  }
};

const _setUpMandate = async body => {
  try {
    const { merchantId, serviceTypeId, apiKey, baseUrl } = remitaConfig;
    body.merchantId = merchantId;
    body.serviceTypeId = serviceTypeId;
    body.hash = sha512(
      `${merchantId}${serviceTypeId}${body.requestId}${body.amount}${apiKey}`
    ).toString();
    const options = {
      method: "POST",
      uri: `${baseUrl}/exapp/api/v1/send/api/echannelsvc/echannel/mandate/setup`,
      body,
      json: true,
      headers: {
        "Content-Type": "application/json"
      }
    };
    const response = await request(options);
    return Promise.resolve(eval(response));
  } catch (error) {
    console.log(error);
    // Remita service is not consistence.... arrhhh
    // I am resolving a value which I will use to check for errors so I can perform
    // some operation, like deleting any records created before this error
    // NOTE: Throwing or rejecting would be great yea?, but...
    return Promise.resolve("remita-error");
  }
};

const _mandateStatus = async orderNumber => {
  try {
    const { merchantId, apiKey, baseUrl } = remitaConfig;
    const hash = sha512(`${orderNumber}${apiKey}${merchantId}`).toString();
    const options = {
      method: "GET",
      uri: `${baseUrl}/ecomm/mandate/${merchantId}/${orderNumber}/${hash}/status.reg`,
      json: true,
      headers: {
        "Content-Type": "application/json"
      }
    };
    const response = await request(options);
    return Promise.resolve(eval(response));
  } catch (error) {
    return Promise.reject(error);
  }
};

const _mandatePaymentHistory = async body => {
  try {
    const { merchantId, apiKey, baseUrl } = remitaConfig;
    body.hash = sha512(
      `${body.mandateId}${merchantId}${body.requestId}${apiKey}`
    ).toString();
    const options = {
      method: "POST",
      uri: `${baseUrl}/exapp/api/v1/send/api/echannelsvc/echannel/mandate/payment/history`,
      json: true,
      body,
      headers: {
        "Content-Type": "application/json"
      }
    };
    const response = await request(options);
    return Promise.resolve(eval(response));
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = {
  _generateRRR,
  _getRRRStatus,
  _setUpMandate,
  _mandateStatus,
  _mandatePaymentHistory
};
