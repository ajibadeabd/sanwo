const models = require('../models/')

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
 * @param {Number} offset
 * @param {Number} limit
 * @param {function} callback
 * @return {function} callback
 */
Socket.prototype.getConversation = function (users, offset, limit, callback) {
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
  models.Message.find(query)
    .skip(offset)
    .limit(limit)
    .populate('toUserId fromUserId', '_id firstName lastName email')
    .sort({ createdAt: 'desc' })
    .exec(callback)
}

Socket.prototype.getMessages = function (user, offset, limit, callback) {
  const query = {
    $or: [
      {
        toUserId: user.userId
      },
      {
        fromUserId: user.userId
      }
    ]
  }
  models.Message.find(query)
    // .populate('toUserId fromUserId', '_id firstName lastName email')
    .skip(offset)
    .limit(limit)
    .sort({ createdAt: 'desc' })
    .exec(callback)
}

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
      if (data.fromUserId == null || data.toUserId == null) {
        callback({
          success: false,
          message: 'Invalid data sent',
          data
        })
      } else {
        if (this.clients[data.toUserId]) {
          data.toSocketId = this.clients[data.toUserId]
        }
        this.sendMessage(socket, data, callback)
      }
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
      const users = {
        fromUserId: options.fromUserId,
        toUserId: options.toUserId,
      }
      let limit = parseInt(options.limit)
      let offset = parseInt(options.offset)
      offset = offset || 0
      limit = limit || 20
      this.getConversation(users, offset, limit, (err, results) => {
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

    /**
     * Event name 'messages': Fetches recent messages for a particular user
     * The client emits this event along with the
     * userData to fetch messages for and a callback.
     * @param {Object} options
     * example {"userId": {MongoId}}
     */
    socket.on('messages', (options, callback) => {
      let limit = parseInt(options.limit)
      let offset = parseInt(options.offset)
      offset = offset || 0
      limit = limit || 20
      this.getMessages({ userId: options.userId }, offset, limit, (err, results) => {
        if (err) {
          callback({
            success: false,
            data: null
          })
          throw err
        } else {
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


module.exports = Socket
