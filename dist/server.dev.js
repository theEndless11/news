"use strict";

var express = require('express');

var mongoose = require('mongoose');

var bodyParser = require('body-parser');

var cors = require('cors');

var multer = require('multer');

var dotenv = require('dotenv');

var path = require('path'); // Load environment variables from .env file


dotenv.config(); // Initialize the app

var app = express();
var port = process.env.PORT || 3000; // Middleware

app.use(cors());
app.use(bodyParser.json()); // Set up file upload (for media files like images/videos)

var storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, 'uploads/'); // Specify upload folder
  },
  filename: function filename(req, file, cb) {
    // Format the filename with timestamp and original name
    cb(null, Date.now() + '-' + file.originalname);
  }
});
var upload = multer({
  storage: storage
}); // Serve static files (HTML, CSS, JS) from the 'public' directory

app.use(express["static"](path.join(__dirname, 'public'))); // MongoDB Connection

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  return console.log('MongoDB connected');
})["catch"](function (err) {
  return console.log('Error connecting to MongoDB:', err);
}); // Define Mongoose Models

var User = mongoose.model('User', new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    "default": 'active'
  }
}));
var Message = mongoose.model('Message', new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  text: {
    type: String
  },
  file: {
    type: String
  },
  // URL to the file
  time: {
    type: Date,
    "default": Date.now
  },
  isPrivate: {
    type: Boolean,
    "default": false
  },
  toUser: {
    type: String
  } // Private message recipient

}));
var FriendRequest = mongoose.model('FriendRequest', new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  receiver: {
    type: String,
    required: true
  },
  status: {
    type: String,
    "enum": ['pending', 'accepted', 'rejected'],
    "default": 'pending'
  },
  sentAt: {
    type: Date,
    "default": Date.now
  }
})); // Routes
// Route for registration

app.post('/register', function _callee(req, res) {
  var username, user;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          username = req.body.username;
          _context.prev = 1;
          user = new User({
            username: username
          });
          _context.next = 5;
          return regeneratorRuntime.awrap(user.save());

        case 5:
          res.status(200).send({
            message: 'User registered successfully!'
          });
          _context.next = 11;
          break;

        case 8:
          _context.prev = 8;
          _context.t0 = _context["catch"](1);
          res.status(400).send({
            message: 'Error registering user',
            error: _context.t0
          });

        case 11:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 8]]);
}); // Route to get all active users

app.get('/users', function _callee2(req, res) {
  var users;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(User.find({
            status: 'active'
          }));

        case 3:
          users = _context2.sent;
          res.json(users);
          _context2.next = 10;
          break;

        case 7:
          _context2.prev = 7;
          _context2.t0 = _context2["catch"](0);
          res.status(500).send({
            message: 'Error fetching users',
            error: _context2.t0
          });

        case 10:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // Route to send a friend request

app.post('/send-friend-request', function _callee3(req, res) {
  var _req$body, sender, receiver, existingRequest, friendRequest;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _req$body = req.body, sender = _req$body.sender, receiver = _req$body.receiver;
          _context3.prev = 1;
          _context3.next = 4;
          return regeneratorRuntime.awrap(FriendRequest.findOne({
            sender: sender,
            receiver: receiver,
            status: {
              $in: ['pending', 'accepted']
            }
          }));

        case 4:
          existingRequest = _context3.sent;

          if (!existingRequest) {
            _context3.next = 7;
            break;
          }

          return _context3.abrupt("return", res.status(400).send({
            message: 'Friend request already sent or accepted.'
          }));

        case 7:
          friendRequest = new FriendRequest({
            sender: sender,
            receiver: receiver
          });
          _context3.next = 10;
          return regeneratorRuntime.awrap(friendRequest.save());

        case 10:
          res.status(200).send({
            message: 'Friend request sent successfully!'
          });
          _context3.next = 16;
          break;

        case 13:
          _context3.prev = 13;
          _context3.t0 = _context3["catch"](1);
          res.status(500).send({
            message: 'Error sending friend request',
            error: _context3.t0
          });

        case 16:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[1, 13]]);
}); // Route to accept a friend request

app.post('/accept-friend-request', function _callee4(req, res) {
  var _req$body2, sender, receiver, request;

  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _req$body2 = req.body, sender = _req$body2.sender, receiver = _req$body2.receiver;
          _context4.prev = 1;
          _context4.next = 4;
          return regeneratorRuntime.awrap(FriendRequest.findOneAndUpdate({
            sender: sender,
            receiver: receiver,
            status: 'pending'
          }, {
            status: 'accepted'
          }, {
            "new": true
          }));

        case 4:
          request = _context4.sent;

          if (request) {
            _context4.next = 7;
            break;
          }

          return _context4.abrupt("return", res.status(400).send({
            message: 'No pending request found.'
          }));

        case 7:
          res.status(200).send({
            message: 'Friend request accepted!'
          });
          _context4.next = 13;
          break;

        case 10:
          _context4.prev = 10;
          _context4.t0 = _context4["catch"](1);
          res.status(500).send({
            message: 'Error accepting friend request',
            error: _context4.t0
          });

        case 13:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[1, 10]]);
}); // Route to send a message (public or private)

app.post('/send-message', upload.single('file'), function _callee5(req, res) {
  var _req$body3, user, text, toUser, isPrivate, file, message;

  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _req$body3 = req.body, user = _req$body3.user, text = _req$body3.text, toUser = _req$body3.toUser, isPrivate = _req$body3.isPrivate;
          file = req.file ? "/uploads/".concat(req.file.filename) : null;
          _context5.prev = 2;
          message = new Message({
            user: user,
            text: text,
            file: file,
            isPrivate: isPrivate,
            toUser: toUser
          });
          _context5.next = 6;
          return regeneratorRuntime.awrap(message.save());

        case 6:
          res.status(200).send({
            message: 'Message sent successfully!'
          });
          _context5.next = 12;
          break;

        case 9:
          _context5.prev = 9;
          _context5.t0 = _context5["catch"](2);
          res.status(500).send({
            message: 'Error sending message',
            error: _context5.t0
          });

        case 12:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[2, 9]]);
}); // Route to get all messages (or filtered messages based on user)

app.get('/messages', function _callee6(req, res) {
  var username, messages;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          username = req.query.username; // We can pass the `username` as a query parameter to filter messages

          _context6.prev = 1;

          if (!username) {
            _context6.next = 8;
            break;
          }

          _context6.next = 5;
          return regeneratorRuntime.awrap(Message.find({
            $or: [{
              isPrivate: false
            }, {
              toUser: username
            }]
          }).sort({
            time: 1
          }));

        case 5:
          messages = _context6.sent;
          _context6.next = 11;
          break;

        case 8:
          _context6.next = 10;
          return regeneratorRuntime.awrap(Message.find().sort({
            time: 1
          }));

        case 10:
          messages = _context6.sent;

        case 11:
          res.json(messages);
          _context6.next = 17;
          break;

        case 14:
          _context6.prev = 14;
          _context6.t0 = _context6["catch"](1);
          res.status(500).send({
            message: 'Error fetching messages',
            error: _context6.t0
          });

        case 17:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[1, 14]]);
}); // Serve media files (images/videos)

app.use('/uploads', express["static"](path.join(__dirname, 'uploads'))); // Start the server

app.listen(port, function () {
  console.log("Server running on port ".concat(port));
});
//# sourceMappingURL=server.dev.js.map
