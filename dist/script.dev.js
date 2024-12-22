"use strict";

// Initialize variables
var username = prompt("Enter your username:");
var ably = new Ably.Realtime('knH84g.xyERFQ:_YgFb-hkCXQNM2gCyRhIt2Q0NWuKd2JmfNhLZILR7DE');
var channel = ably.channels.get('chat-room'); // Arrays to store users and messages

var users = [];
var messages = []; // DOM Elements

var messageInput = document.getElementById('message-input');
var sendButton = document.getElementById('send-button');
var chatMessages = document.getElementById('chat-messages');
var userList = document.getElementById('user-list');
var userStatus = document.getElementById('user-status');
var userSelect = document.getElementById('user-select'); // Send message to channel

function sendMessage() {
  var message = messageInput.value.trim();

  if (message !== "") {
    channel.publish('message', {
      user: username,
      text: message,
      time: new Date().toLocaleTimeString()
    });
    messageInput.value = '';
  }
} // Handle new messages


channel.subscribe('message', function (msg) {
  var msgElement = document.createElement('div');
  msgElement.innerHTML = "<strong>".concat(msg.data.user, "</strong> [").concat(msg.data.time, "]: ").concat(msg.data.text);
  chatMessages.appendChild(msgElement);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
}); // Handle user joining and leaving

channel.subscribe('user-action', function (msg) {
  if (msg.data.action === 'join') {
    users.push(msg.data.username);
  } else if (msg.data.action === 'leave') {
    users = users.filter(function (user) {
      return user !== msg.data.username;
    });
  }

  updateUserList();
  updateUserStatus(msg.data.action, msg.data.username);
}); // Update the list of available users

function updateUserList() {
  userList.innerHTML = '';
  users.forEach(function (user) {
    var userItem = document.createElement('li');
    userItem.textContent = user;
    userList.appendChild(userItem);
  });
} // Update the user status when someone joins or leaves


function updateUserStatus(action, username) {
  if (action === 'join') {
    userStatus.textContent = "".concat(username, " has joined the chat.");
  } else if (action === 'leave') {
    userStatus.textContent = "".concat(username, " has left the chat.");
  }
} // Handle private message


userSelect.addEventListener('change', function () {
  var selectedUser = userSelect.value;

  if (selectedUser) {
    channel.publish('private-message', {
      to: selectedUser,
      from: username,
      text: 'Private message initiated'
    });
  }
}); // Initialize the user and notify others of joining

function initializeUser() {
  channel.publish('user-action', {
    action: 'join',
    username: username
  });
  users.push(username);
  updateUserList();
} // Listen for when a user joins or leaves the chat


initializeUser(); // Add event listener to send button

sendButton.addEventListener('click', sendMessage); // Add event listener for enter key to send message

messageInput.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
//# sourceMappingURL=script.dev.js.map
