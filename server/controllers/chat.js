"use strict"

const Conversation = require('../models/conversation'),
      Message = require('../models/message'),
      User = require('../models/user');


const newConversation = async (req, res, next) => {
  const recipient = req.body.startDmInput;
  if (!recipient) {
    res.status(422).send({
      error: "Enter a valid recipient."
    });
    return next();
  }
  User.find({ username: {$in: [recipient, req.user.sn]} }, function(err, foundRecipient) {
    if (err) {
      res.send({
        error: err
      });
      return next(err);
    }

    if (foundRecipient.length !== 2) {
      return res.status(422).send({
        error: 'Could not find recipient.'
      });
    }
    const conversation = new Conversation({
      participants: [ foundRecipient[0]._id , foundRecipient[1]._id ]
    })

    conversation.save(function(err, newConversation) {
      if (err) {
        res.send({
          error: err
        });
        return next(err);
      }
      const receiver = foundRecipient[0].username === recipient ? foundRecipient[0]: foundRecipient[1];
      res.status(200).json({
        message: `Started conversation with ${receiver.username}`,
        recipientId: receiver._id,
        recipient: receiver.username,
      })

    });

  });
}
const leaveConversation = async (req, res, next) => {
  const conversationToLeave = req.body.conversationId;
  Conversation.findOneAndRemove({ participants: conversationToLeave }, function(err, foundConversation){
    if (err) {
      res.send({
        error: err
      });
      return next(err);
    }

    res.status(200).json({
      message: 'Left from the Conversation.'
    });
    return next();
  });
}
const getConversations = async (req, res, next) => {
  const username = req.user.sn;
  const user = await User.findOne({username: username});
  Conversation.find({ participants: user._id })
    .sort('_id')
    .populate({
      path: 'participants',
      select: 'username'
    })
    .exec((err, conversations) => {
      if (err) {
        res.send({ error: err });
        return next(err);
      }

      if (conversations.length === 0) {
        return res.status(200).json({
          message: 'No conversations yet'
        })
      }

      const conversationList = [];
      conversations.forEach((conversation) => {
        const conversationWith = conversation.participants.filter(item => {
          return item.username !== username
        });

        conversationList.push(conversationWith[0]);
        if (conversationList.length === conversations.length) {
          return res.status(200).json({
            conversationsWith: conversationList
          })
        }   
      });
    });
};

const sendReply = async (req, res, next) => {
  const privateMessage = req.body.privateMessageInput;
  const { encryptedRecipientMessage, encryptedAuthorMessage } = req.body;
  const recipientId = req.body.recipientId;
  const username = req.user.sn;
  const user = await User.findOne({username: username});

  Conversation.findOne({ participants: {$all: [ user._id, recipientId]} }, function(err, foundConversation) {
    if (err) {
      res.send({
        errror: err
      });
      return next(err);
    }
    if (!foundConversation) {
      return res.status(200).json({
        message: 'Could not find conversation'
      })
    }

    const reply = new Message({
      conversationId: foundConversation._id,
      encryptedRecipientMessage,
      encryptedAuthorMessage,
      author: {
        kind: 'User',
        item: user._id
      }
    })

   reply.save(function(err, sentReply) {
    if (err) {
      res.send({
        error: err
      });
      return next(err);
    }

    res.status(200).json({
      reply: reply,
      message: 'Reply sent.'
    });
    return next();
    });
  });
}

const getPrivateMessages =  async (req, res, next) => {
  const username = req.user.sn;
  const user = await User.findOne({username: username});
  const recipientId = req.params.recipientId;

  Conversation.findOne({ participants: {$all: [ user._id, recipientId]}}, function(err, foundConversation) {
    if (err) {
      res.send({
        error: err
      });
      return next(err);
    }

    if (!foundConversation) {
      return res.status(200).json({
        message: 'Could not find conversation'
      })
    }

    Message.find({ conversationId: foundConversation._id })
    .select('createdAt encryptedRecipientMessage encryptedAuthorMessage author')
    .sort('-createdAt')
    .populate('author.item')
    .exec(function(err, message) {
      if (err) {
        res.send({
          error: err
        });
        return next();
      }
      const sortedMessage = message.reverse();

      res.status(200).json({
        conversation: sortedMessage,
        conversationId: foundConversation._id
      });
    });
  });
}

module.exports = {
  getPrivateMessages,
  sendReply,
  getConversations,
  leaveConversation,
  newConversation
}
