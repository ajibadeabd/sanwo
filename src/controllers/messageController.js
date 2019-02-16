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


const queryRecentChat = async (userId, callback) => {
  try {
    if (!mongoRegex.test(userId)) {
      callback(true, 'The userId sent is not a valid mongoId')
      return
    }
    // First we check that the user exists
    const currentUser = await models.User.findOne({ _id: userId })
    if (!currentUser) {
      callback(true, 'Could not find the user you are trying to get message for')
      return
    }

    const query = {
      $or: [
        {
          toUserId: userId
        },
        {
          fromUserId: userId
        }
      ]
    }
    // secondly we get the distinct users which our currentUser has chatted with
    const relationIds = await models.Message.aggregate([
      { $match: query },
      // group by key
      { $group: { _id: { toUserId: '$toUserId', fromUserId: '$fromUserId' } } },
      // // Clean up the output
      { $project: { _id: 0, key: { toUserId: '$_id.toUserId', fromUserId: '$_id.fromUserId' } } }
    ])
    // if we can't find any it means our user has'nt chatted with anyone. So return
    if (!relationIds.length) {
      callback(true, 'No messages found relating to this user')
      return
    }
    // Now, let's get the details of the users
    const recentlyChattedUserPromises = relationIds.map(async (relation) => {
      relation = Object.values(relation.key)
      // Here we're checking if our current user have'nt chatted with a user with invalidID
      if (relation && !relation.every(id => mongoRegex.test(id))) return []
      const results = await models.User.find({ _id: { $in: relation } })
        .select('_id firstName lastName email name')
      return results
    })

    // if empty array is returned, respond accordingly
    if (!recentlyChattedUserPromises.length) {
      callback(true, 'User records not found')
      return
    }
    // Resolve all promises of query
    Promise.all(recentlyChattedUserPromises).then((recentlyChattedUsers) => {
      // recentlyChattedUsers will be in nested array of objects, we flatten it to get each object
      recentlyChattedUsers = flattenArray(recentlyChattedUsers)
      if (recentlyChattedUsers.length) {
        // get the 2 recent messages between the users, but first skipp our current user
        const promises = recentlyChattedUsers.filter(e => e.id !== userId)
          .map(async result => ({
            ...result._doc,
            message: await queryConversations(
              {
                fromUserId: userId,
                toUserId: result._id
              }
            ).sort({ createdAt: 'desc' }).limit(2)
          }))
        // return the message via callback function
        Promise.all(promises).then((records) => {
          callback(null, records)
        })
      }
    })
  } catch (e) {
    throw e
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
      let limit = parseInt(options.limit)
      let offset = parseInt(options.offset)
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

    /**
     * Event name 'messages': Fetches recent messages for a particular user
     * The client emits this event along with the
     * userData to fetch messages for and a callback.
     * @param {Object} options
     * example {"userId": {MongoId}}
     */
    socket.on('messages', (options, callback) => {
      if (!options.userId) {
        callback({ success: false, data: 'userId property not set' })
        return
      }
      queryRecentChat(options.userId, (err, results) => {
        if (err) {
          callback({
            success: false,
            message: results,
            data: [],
          })
          throw err
        } else {
          callback({
            success: true,
            data: results
          })
        }
      }).catch((err) => {
        throw err
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

const getRecentChat = (req, res) => {
  queryRecentChat(req.query.userId || req.body.userId, (err, results) => {
    if (err) {
      res.send({
        success: false,
        message: results,
      }).status(400)
    } else {
      res.send({
        success: true,
        message: 'Successfully fetching recent messages',
        data: {
          results
        }
      })
    }
  })
    .catch((err) => {
      throw err
    })
}

module.exports = Socket
module.exports.getRecentChat = getRecentChat
