const socket = io();

const msgForm = document.querySelector("#sendmsg");
const msgFormInput = document.querySelector("input");
const msgFormButton = msgForm.querySelector("button");
const sendLocButton = document.querySelector("#send-location");
const messages = document.querySelector("#message");

//templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoScroll = () => {
  //new message element
  const newmessage = messages.lastElementChild;

  //height of new message
  const newMessageStyles = getComputedStyle(newmessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = newmessage.offsetHeight + newMessageMargin;

  //visible height
  const visibleHeight = messages.offsetHeight;

  //height of   message container
  const containerHeight = messages.scrollHeight;

  //how far have i scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("welcomeMsg", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("locationMessage", (message) => {
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, { room, users });
  document.querySelector("#sidebar").innerHTML = html;
});

msgForm.addEventListener("submit", (e) => {
  e.preventDefault();

  msgFormButton.setAttribute("disabled", "disabled");

  const message = msgFormInput.value;
  socket.emit("sendMessage", message, (error) => {
    msgFormButton.removeAttribute("disabled");
    msgFormInput.value = "";
    msgFormInput.focus();

    if (error) {
      return console.log(error);
    }

    console.log("the message was delivered");
  });
});

sendLocButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("does not support geolocation");
  }

  sendLocButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      () => {
        console.log("Location Shared");
        sendLocButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
