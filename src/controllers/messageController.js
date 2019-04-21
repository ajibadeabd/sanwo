const models = require('../models/')
const { flattenArray } = require('../../utils/helper-functions')

const mongoRegex = /^[a-f\d]{24}$/i // to validate mongoId

const queryConversations = function (users) {
  const query = {
    $or: [
      {
        $and: [
          {
            toUserId: users.fromUserId
          }, {
            fromUserId: users.toUserId
          }
        ]
      }, {
        $and: [
          {
            toUserId: users.toUserId
          }, {
            fromUserId: users.fromUserId
          }
        ]
      }
    ]
  }
  return models.Message.find(query)
}


const queryRecentChat = async (userId) => {
  try {
    if (!mongoRegex.test(userId)) {
      return Promise.reject(new Error('The userId sent is not a valid mongoId'))
    }
    // First we check that the user exists
    const currentUser = await models.User.findOne({ _id: userId })
    if (!currentUser) {
      return Promise.reject(new Error('Could not find the user you are trying to get message for'))
    }

    const query = { $or: [{ toUserId: userId }, { fromUserId: userId }] }
    // secondly we get the distinct users which our currentUser has chatted with
    const relationIds = await models.Message.aggregate([
      { $match: query },
      { $group: { _id: { toUserId: '$toUserId', fromUserId: '$fromUserId' } } },
      { $project: { _id: 0, key: { toUserId: '$_id.toUserId', fromUserId: '$_id.fromUserId' } } }
    ])
    // if we can't find any it means our user has not chatted with anyone. Message
    if (!relationIds.length) {
      return Promise.resolve({ data: [], message: 'No messages found relating to this user' })
    }

    let uniqueUser = relationIds.map(relation => Object.values(relation.key))

    // recentlyChattedUsers will be in nested array of objects, we flatten it to get each object
    uniqueUser = flattenArray(uniqueUser)

    // get the unique ids in the list of users our current user have chatted, make sure
    // we are not fetching our current user details
    uniqueUser = uniqueUser
      .filter((value, index, self) => value !== userId && self.indexOf(value) === index)

    // Now, let's get the details of the users
    const recentlyChattedUsers = await models.User.find({ _id: { $in: uniqueUser } })
      .select('_id firstName lastName email name avatar')

    // if empty array is returned, it means the users are not found
    if (!recentlyChattedUsers.length) return Promise.reject(new Error('User records not found'))

    // get the 2 recent messages between the users
    const promises = recentlyChattedUsers
      .map(async result => ({
        ...result._doc,
        message: await queryConversations({ fromUserId: userId, toUserId: result._id })
          .sort({ createdAt: 'desc' }).limit(2)
      }))
    // resolve promises
    const recentChats = await Promise.all(promises)
    // sort the result by message date
    recentChats
      .sort((a, b) => new Date(b.message[0].createdAt) - new Date(a.message[0].createdAt))
    // return response
    return { data: recentChats, message: 'Successfully fetching messages' }
  } catch (e) {
    return Promise.reject(new Error(e))
  }
}

/**
 * SocketIo constructor
 * @param {Socket} socket
 * @constructor
 */
function Socket (socket) {
  this.io = socket

  //  Object containing the userId as key and socketId as value
  this.clients = {}
}


/**
 * @Description Gets conversation history between two users.
 * Query translation in SQL is SELECT * FROM messages
 * WHERE toUserId = selectedUserId AND fromUserId = currentUserId
 * OR toUserId = selectedUserId AND fromUserId = currentUserId
 * @param {Object} users: should look like {fromUserId:currentUserId, toUserId:selectedUserId}
 * @return {function} callback
 */
Socket.prototype.getConversation = queryConversations

/**
 * Sends message to a user and save conversation in DB in cases where the users is offline
 * @param {Object} socket
 * @param {Object} data
 * @param {function} callback
 * @return {function} calls the callback
 */
Socket.prototype.sendMessage = function (socket, data, callback) {
  models.Message.create({
    message: data.message,
    fromUserId: data.fromUserId,
    toUserId: data.toUserId,
  }, (err, result) => {
    if (err) {
      // let the user know message wasn't saved before throwing error
      callback({
        success: false,
        message: result
      })
      throw err
    } else {
      // if the socketID is available emit the event so the user receives message in real-time
      if (data.toSocketId) {
        /**
         * Client must listen to this event to get new message sent to them
         * Emits new-message event which send a private message
         * to the connected user.
         */
        socket.to(data.toSocketId)
          .emit('new-message', result)
      }

      callback({
        success: true,
        message: 'message sent',
        data: result
      })
    }
  })
}

/**
 * ioEvents registers sockets events
 * @return {VoidFunction} /
 */
Socket.prototype.ioEvents = function () {
  this.io.on('connection', (socket) => {
    /**
     * Event name 'add-message': The client emits this event
     * along with the message data to be saved and a callback.
     * After saving the socketIo attempts to emmit the message to the user
     * which the message was sent to.
     * @param {Object} data
     * example {"fromUserId": {MongoId}, "toUserId": {MongoId}, "message": {String}}
     * @param {function} callback when called parameter is Object
     * example { success: {Boolean}, message: {String}, data: {Object}}
     */
    socket.on('add-message', (data, callback) => {
      if (data.fromUserId == null || data.toUserId == null || !data.message) {
        callback({
          success: false,
          message: 'Invalid data sent. Send fromUserId, toUserId and message property',
          data
        })
        return
      }
      if (!mongoRegex.test(data.fromUserId) || !mongoRegex.test(data.toUserId)) {
        callback({ success: false, message: 'fromUserId or toUserId sent is not a valid mongoId', data })
        return
      }
      if (data.fromUserId === data.toUserId) {
        callback({ success: false, message: 'You can\'t chat yourself here.', data })
        return
      }
      if (this.clients[data.toUserId]) {
        data.toSocketId = this.clients[data.toUserId]
      }
      this.sendMessage(socket, data, callback)
    })

    /**
     * Event name 'conversations': Fetches conversation between two users
     * The client emits this event along with the
     * userData to fetch conversations for and a callback.
     * @param {Object} options
     * from ID is the current user, to ID is person being chatted
     * example {"fromUserId": {MongoId}, "toUserId": {MongoId}}
     */
    socket.on('conversations', (options, callback) => {
      if (!mongoRegex.test(options.fromUserId) || !mongoRegex.test(options.toUserId)) {
        callback({
          success: false,
          message: 'fromUserId or toUserId sent is not a valid mongoId',
          options
        })
        return
      }
      const users = {
        fromUserId: options.fromUserId,
        toUserId: options.toUserId,
      }
      let limit = parseInt(options.limit, 10)
      let offset = parseInt(options.offset, 10)
      offset = offset || 0
      limit = limit || 20
      this.getConversation(users)
        .skip(offset)
        .limit(limit)
        .populate('toUserId fromUserId', '_id firstName lastName email')
        .sort({ createdAt: 'desc' })
        .exec((err, results) => {
          if (err) {
            callback({
              success: false,
              data: null
            })
            throw err
          }
          if (!err) {
            callback({
              success: true,
              data: {
                offset,
                limit,
                results
              }
            })
          }
        })
    })


    socket.on('disconnect', () => {
      // do something when a user disconnects
    })
  })
}

Socket.prototype.startSocket = function () {
  this.io.use((socket, next) => {
    const userID = socket.request._query.userId
    //  save the connected user into our client Object list
    this.clients[userID] = socket.id
    next()
  })

  this.ioEvents()
}

/**
 * @description Fetches recent messages for the current user
 * @param { Object } req
 * @param { Object } res
 * @return {Promise<void>} Object
 */
const getRecentChat = async (req, res) => {
  try {
    const { data, message } = await queryRecentChat(req.body.userId)
    res.send({
      success: true,
      message,
      data
    })
  } catch (e) {
    res.status(400).send({ success: false, message: e.message })
    throw new Error(e)
  }
}

const truncateMessage = async (req, res) => {
  try {
    const results = await req.Models.Message.deleteMany({})
    res.send({
      success: true,
      message: 'Successfully deleted messages',
      data: { results }
    })
  } catch (e) {
    res.status(400).send({ success: false, message: e.message })
    throw new Error(e)
  }
}

module.exports = {
  Socket,
  getRecentChat,
  truncateMessage
}
