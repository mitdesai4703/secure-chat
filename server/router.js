const express = require('express'),
    passportService = require('./config/passport'),
    passport = require('passport'),
    User = require('./models/user'),
    ChatController = require('./controllers/chat'),
    AuthController = require('./controllers/authentication');

const requireAuth = passport.authenticate('jwt', {session: false});



module.exports = function (app) {
    const apiRoutes = express.Router(),
        authRoutes = express.Router(),
        chatRoutes = express.Router();

    apiRoutes.use('/auth', authRoutes);
    authRoutes.post('/register', AuthController.register);
    authRoutes.post('/login', AuthController.login);
    authRoutes.get('/certif/:username', AuthController.getUserCertificate)
    apiRoutes.use('/chat', chatRoutes);
    chatRoutes.get('/', requireAuth, ChatController.getConversations);
    chatRoutes.get('/privatemessages/:recipientId', requireAuth, ChatController.getPrivateMessages);
    chatRoutes.post('/new', requireAuth, ChatController.newConversation);
    chatRoutes.post('/leave', requireAuth, ChatController.leaveConversation);
    chatRoutes.post('/reply', requireAuth, ChatController.sendReply);
    app.use('/api', apiRoutes);

}
