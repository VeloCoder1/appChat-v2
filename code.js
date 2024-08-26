(function () {
  const app = document.querySelector(".app");
  const socket = io();

  let uname;
  let typingTimer;
  const typingInterval = 3000; // 3 seconds

  // Define time format options
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,  // 12-hour format with AM/PM
    timeZone: 'Asia/karachi'  // Change to your desired time zone
  };

  // Helper function to format timestamps
  function formatTimestamp(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', timeOptions);
  }

  // Join chat room functionality
  app.querySelector(".join-screen #join-chat").addEventListener("click", function () {
    let username = app.querySelector(".join-screen #username").value;

    if (username.length === 0) {
      alert("Username cannot be empty.");
      return;
    }

    // Emit the new user event to the server
    socket.emit("newuser", username);

    uname = username;

    // Switch from join screen to chat screen
    app.querySelector(".join-screen").classList.remove("active");
    app.querySelector(".chat-screen").classList.add("active");
  });

  // Send message functionality
  app.querySelector("#send-message").addEventListener("click", function () {
    const messageInput = app.querySelector("#message-input");
    let message = messageInput.value;

    if (message.length === 0) {
      return;
    }

    // Send the message to the server
    sendMessage(message);

    // Clear the input field
    messageInput.value = "";
  });

  // Helper function to send message
  function sendMessage(message) {
    const timestamp = new Date().toISOString(); // ISO format
    appendMessage("my-message", uname, message, formatTimestamp(timestamp));

    socket.emit("chat", {
      username: uname,
      text: message,
      timestamp: timestamp,
    });
  }

  // File input and upload
  const fileInput = app.querySelector("#file-input");
  const uploadButton = app.querySelector("#upload-file");

  // Trigger file input click on upload button click
  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });

  // Listen for file input changes
  fileInput.addEventListener("change", handleFileUpload);

  // Handle file upload
  function handleFileUpload() {
    const file = fileInput.files[0];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (file && file.size <= maxFileSize) {
      const reader = new FileReader();

      // Read the file as a Data URL (base64)
      reader.onload = function (e) {
        const fileData = e.target.result;
        const fileType = file.type;
        const timestamp = new Date().toISOString(); // ISO format

        // Append the file to the sender's chat window
        appendFileMessage("my-message", uname, file.name, fileData, fileType, formatTimestamp(timestamp));

        // Send the file to the server
        socket.emit("file", {
          username: uname,
          fileName: file.name,
          fileData: fileData,
          fileType: fileType,
          timestamp: timestamp,
        });
      };

      reader.readAsDataURL(file);
    } else {
      alert("File too large or invalid.");
    }
  }

  // Listen for incoming messages from the server
  socket.on("chat", function (data) {
    const timestamp = formatTimestamp(data.timestamp);
    appendMessage("other-message", data.username, data.text, timestamp);
  });

  // Listen for file sharing from other users
  socket.on("file", function (data) {
    const timestamp = formatTimestamp(data.timestamp);
    appendFileMessage("other-message", data.username, data.fileName, data.fileData, data.fileType, timestamp);
  });

  // Listen for user updates
  socket.on("update", function (update) {
    const updateDiv = document.createElement("div");
    updateDiv.classList.add("update");
    updateDiv.textContent = update;

    const messageContainer = app.querySelector(".messages");
    messageContainer.appendChild(updateDiv);

    // Auto-scroll to the latest update
    messageContainer.scrollTop = messageContainer.scrollHeight;
  });

  // Update user list
  socket.on("userList", function (users) {
    const userList = app.querySelector(".user-list");
    userList.innerHTML = '';
    users.forEach((user) => {
      const userDiv = document.createElement("div");
      userDiv.classList.add("user");
      userDiv.textContent = user;
      userList.appendChild(userDiv);
    });
  });

  // Emit typing event to server
  app.querySelector("#message-input").addEventListener("input", function () {
    clearTimeout(typingTimer);
    socket.emit("typing", uname);
    typingTimer = setTimeout(() => {
      socket.emit("stopTyping");
    }, typingInterval);
  });

  // Listen for typing indicator
  socket.on("typing", function (username) {
    const typingDiv = app.querySelector(".typing");
    typingDiv.textContent = `${username} is typing...`;
  });

  // Listen for stop typing indicator
  socket.on("stopTyping", function () {
    const typingDiv = app.querySelector(".typing");
    typingDiv.textContent = '';
  });

  // Function to append message to the chat screen
  function appendMessage(type, username, message, timestamp) {
    const messageContainer = app.querySelector(".messages");

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", type);

    const msgHTML = `
      <div>
        <div class="name">${username}</div>
        <div class="text">${message}</div>
        <div class="timestamp">${timestamp}</div>
      </div>
    `;

    msgDiv.innerHTML = msgHTML;
    // Add click event to toggle timestamp visibility
    msgDiv.addEventListener("click", function () {
      const timestampDiv = this.querySelector(".timestamp");
      timestampDiv.style.display = timestampDiv.style.display === "none" ? "block" : "none";
    });
    
    messageContainer.appendChild(msgDiv);

    // Auto-scroll to the latest message
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  // Function to append file message to the chat screen
  function appendFileMessage(type, username, fileName, fileData, fileType, timestamp) {
    const messageContainer = app.querySelector(".messages");

    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", type);

    let fileHTML = `<div class="name">${username}</div>`;

    if (fileType.startsWith("image/")) {
      fileHTML += `<img src="${fileData}" alt="${fileName}" style="max-width: 200px;"/><div class="timestamp">${timestamp}</div>`;
    } else if (fileType.startsWith("video/")) {
      fileHTML += `<video controls style="max-width: 200px;">
                    <source src="${fileData}" type="${fileType}">
                  </video><div class="timestamp">${timestamp}</div>`;
    } else {
      fileHTML += `<a href="${fileData}" download="${fileName}">${fileName}</a><div class="timestamp">${timestamp}</div>`;
    }

    msgDiv.innerHTML = fileHTML;
    
    // Add click event to toggle timestamp visibility
    msgDiv.addEventListener("click", function () {
      const timestampDiv = this.querySelector(".timestamp");
      timestampDiv.style.display = timestampDiv.style.display === "none" ? "block" : "none";
    });
    
    messageContainer.appendChild(msgDiv);

    // Auto-scroll to the latest message
    messageContainer.scrollTop = messageContainer.scrollHeight;
      // Toggle user list visibility
  const toggleUserListButton = document.getElementById("toggle-user-list");
  const userListContainer = document.getElementById("user-list-container");

  toggleUserListButton.addEventListener("click", function () {
    if (userListContainer.classList.contains("hidden")) {
      userListContainer.classList.remove("hidden");
      toggleUserListButton.textContent = "Hide Users";
    } else {
      userListContainer.classList.add("hidden");
      toggleUserListButton.textContent = "Show Users";
    }
  });
  }
})();
const toggleButton = document.getElementById('toggle-user-list');
const userListContainer = document.getElementById('user-list-container');

toggleButton.addEventListener('click', () => {
    if (userListContainer.classList.contains('hidden')) {
        userListContainer.classList.remove('hidden');
        userListContainer.classList.add('visible');
        toggleButton.textContent = 'Close';
        toggleButton.style.backgroundColor = '#0056b3';
        toggleButton.style.color = '#ffffff';
    } else {
        userListContainer.classList.remove('visible');
        userListContainer.classList.add('hidden');
        toggleButton.textContent = 'Users';
        toggleButton.style.backgroundColor = '#ffffff';
        toggleButton.style.color = '#0056b3';
    }
});
