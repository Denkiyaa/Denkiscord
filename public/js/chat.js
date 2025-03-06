// chat.js

function initChat() {
    sendBtn.addEventListener('click', () => {
      const msg = messageInput.value;
      if (msg.trim() !== '') {
        socket.emit('chat message', { msg, nickname });
        messageInput.value = '';
      }
    });
  
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        sendBtn.click();
      }
    });
  }
  
  function appendChatMessage(data) {
    const msgDiv = document.createElement('div');
    msgDiv.textContent = data.nickname + ": " + data.msg;
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
  }
  
  function updateUserList(users) {
    channelUserList.innerHTML = "";
    for (const user of users) {
      channelUsers[user.id] = user.nickname;
      const li = document.createElement('li');
      li.id = `user-${user.id}`;
      li.textContent = user.nickname;
      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        openContextMenu(e, user.id);
      });
      channelUserList.appendChild(li);
    }
  }
  