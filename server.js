const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Initialize the app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Set up file upload (for media files like images/videos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify upload folder
  },
  filename: (req, file, cb) => {
    // Format the filename with timestamp and original name
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Define Mongoose Models
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  status: { type: String, default: 'active' },
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String },
  file: { type: String }, // URL to the file
  time: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  toUser: { type: String }, // Private message recipient
}));

const FriendRequest = mongoose.model('FriendRequest', new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  sentAt: { type: Date, default: Date.now },
}));

// Routes

// Route for registration
app.post('/register', async (req, res) => {
  const { username } = req.body;
  try {
    const user = new User({ username });
    await user.save();
    res.status(200).send({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(400).send({ message: 'Error registering user', error });
  }
});

// Route to get all active users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({ status: 'active' });
    res.json(users);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching users', error });
  }
});

// Route to send a friend request
app.post('/send-friend-request', async (req, res) => {
  const { sender, receiver } = req.body;

  try {
    // Check if there's an existing friend request (pending or accepted)
    const existingRequest = await FriendRequest.findOne({
      sender,
      receiver,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingRequest) {
      return res.status(400).send({ message: 'Friend request already sent or accepted.' });
    }

    const friendRequest = new FriendRequest({ sender, receiver });
    await friendRequest.save();
    res.status(200).send({ message: 'Friend request sent successfully!' });
  } catch (error) {
    res.status(500).send({ message: 'Error sending friend request', error });
  }
});

// Route to accept a friend request
app.post('/accept-friend-request', async (req, res) => {
  const { sender, receiver } = req.body;

  try {
    // Update the status of the friend request to 'accepted'
    const request = await FriendRequest.findOneAndUpdate(
      { sender, receiver, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );

    if (!request) {
      return res.status(400).send({ message: 'No pending request found.' });
    }

    res.status(200).send({ message: 'Friend request accepted!' });
  } catch (error) {
    res.status(500).send({ message: 'Error accepting friend request', error });
  }
});

// Route to send a message (public or private)
app.post('/send-message', upload.single('file'), async (req, res) => {
  const { user, text, toUser, isPrivate } = req.body;
  const file = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const message = new Message({
      user,
      text,
      file,
      isPrivate,
      toUser,
    });

    await message.save();
    res.status(200).send({ message: 'Message sent successfully!' });
  } catch (error) {
    res.status(500).send({ message: 'Error sending message', error });
  }
});

// Route to get all messages (or filtered messages based on user)
app.get('/messages', async (req, res) => {
  const { username } = req.query; // We can pass the `username` as a query parameter to filter messages

  try {
    let messages;

    if (username) {
      // If a username is provided, filter messages for that user (both public and private)
      messages = await Message.find({
        $or: [{ isPrivate: false }, { toUser: username }],
      }).sort({ time: 1 });
    } else {
      // If no username is provided, return all messages (for admin or public view)
      messages = await Message.find().sort({ time: 1 });
    }

    res.json(messages);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching messages', error });
  }
});

// Serve media files (images/videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
