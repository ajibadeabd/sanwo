const request = require('request-promise')

// TODO replace with correct valid credentials
const remitaConfig = {
  baseUrl: 'https://www.remitademo.net/remita',
  serviceTypeId: '4430731',
  apiKey: '1946',
  merchantId: '2547916',
}

const _generateRRR = async (payload, apiHash) => {
  try {
    const { merchantId, serviceTypeId } = remitaConfig
    payload = { ...payload, serviceTypeId }
    const options = {
      method: 'POST',
      uri: `${remitaConfig.baseUrl}/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit`,
      body: payload,
      json: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`
      }
    }
    const response = await request(options)
    return Promise.resolve(response)
  } catch (error) {
    return Promise.reject(error)
  }
}

const _getRRRStatus = async (rrr, apiHash) => {
  try {
    const { merchantId } = remitaConfig
    const options = {
      method: 'GET',
      uri: `${remitaConfig.baseUrl}/ecomm/${merchantId}/${rrr}/${apiHash}/status.reg`,
      json: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`
      }
    }
    const response = await request(options)
    return Promise.resolve(response)
  } catch (error) {
    return Promise.reject(error)
  }
}

module.exports = {
  _generateRRR,
  _getRRRStatus
}
