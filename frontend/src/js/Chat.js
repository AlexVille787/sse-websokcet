import ChatAPI from "./api/ChatAPI";

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI("http://localhost:3000");
    this.websocket = null;
    this.currentUser = null;
    this.messagesContainer = null;
    this.usersContainer = null;
    this.modal = null;
    this.hint = null;
    this.input = null;
  }

  init() {
    this.bindToDOM();
    this.registerEvents();
  }

  bindToDOM() {
    this.container.innerHTML = `
      <div class="container">
        <h1 class="chat__header">Чат</h1>
        <div class="chat__connect hidden">Подключиться к чату</div>

        <div class="chat__container hidden">
          <div class="chat__area">
            <div class="chat__messages-container"></div>
            <div class="chat__messages-input">
              <form class="form" id="message-form">
                <div class="form__group">
                  <input
                    class="form__input"
                    id="message-input"
                    type="text"
                    placeholder="Type your message here"
                    autocomplete="off"
                  />
                </div>
              </form>
            </div>
          </div>
          <div class="chat__userlist"></div>
        </div>
      </div>

      <div class="modal__form active" id="modal-form">
        <div class="modal__background"></div>
        <div class="modal__content">
          <div class="modal__header">Выберите псевдоним</div>
          <div class="modal__body">
            <form class="form" id="login-form">
              <div class="form__group">
                <input
                  class="form__input"
                  id="login-input"
                  type="text"
                  placeholder="Введите псевдоним"
                  autocomplete="off"
                />
                <div class="form__hint hidden" id="login-hint"></div>
              </div>
              <div class="modal__footer">
                <button class="modal__ok" type="submit">Продолжить</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.messagesContainer = this.container.querySelector(
      ".chat__messages-container",
    );
    this.usersContainer = this.container.querySelector(".chat__userlist");
    this.modal = this.container.querySelector("#modal-form");
    this.hint = this.container.querySelector("#login-hint");
    this.input = this.container.querySelector("#login-input");
    this.chatContainer = this.container.querySelector(".chat__container");

    this.input.focus();
  }

  registerEvents() {
    const loginForm = this.container.querySelector("#login-form");
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.onEnterChatHandler();
    });

    const messageForm = this.container.querySelector("#message-form");
    messageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    window.addEventListener("beforeunload", () => {
      this.onExitHandler();
    });
  }

  async onEnterChatHandler() {
    const name = this.input.value.trim();

    if (!name) {
      this.showHint("Введите псевдоним");
      return;
    }

    const { data } = await this.api.createUser(name);

    if (data.status === "error") {
      this.showHint("Этот псевдоним уже занят. Выберите другой.");
      return;
    }

    this.currentUser = data.user;
    this.hideHint();
    this.modal.classList.remove("active");
    this.chatContainer.classList.remove("hidden");

    this.subscribeOnEvents();
  }

  subscribeOnEvents() {
    this.websocket = new WebSocket("ws://localhost:3000");

    this.websocket.addEventListener("open", () => {
      console.log("WebSocket connected");
    });

    this.websocket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);

      // список пользователей
      if (Array.isArray(data)) {
        this.renderUsers(data);
        return;
      }

      // сообщение
      if (data.type === "send") {
        this.renderMessage(data);
      }
    });

    this.websocket.addEventListener("close", () => {
      console.log("WebSocket closed");
    });

    this.websocket.addEventListener("error", (err) => {
      console.error("WebSocket error", err);
    });
  }

  renderUsers(users) {
    this.usersContainer.innerHTML = "";

    users.forEach((user) => {
      const el = document.createElement("div");
      el.classList.add("chat__user");

      const isYou = this.currentUser && user.id === this.currentUser.id;

      if (isYou) {
        el.classList.add("chat__user-yourself");
      }

      el.textContent = isYou ? "You" : user.name;
      this.usersContainer.appendChild(el);
    });
  }

  renderMessage(msg) {
    const isYou = this.currentUser && msg.user.id === this.currentUser.id;

    const container = document.createElement("div");
    container.classList.add("message__container");
    container.classList.add(
      isYou ? "message__container-yourself" : "message__container-interlocutor",
    );

    const header = document.createElement("div");
    header.classList.add("message__header");
    header.textContent = `${isYou ? "You" : msg.user.name}, ${Chat.formatDate(
      new Date(),
    )}`;

    const text = document.createElement("div");
    text.classList.add("message__text");
    text.textContent = msg.message;

    container.appendChild(header);
    container.appendChild(text);
    this.messagesContainer.appendChild(container);

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  static formatDate(date) {
    const pad = (n) => String(n).padStart(2, "0");
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}.${month}.${year}`;
  }

  sendMessage() {
    const input = this.container.querySelector("#message-input");
    const message = input.value.trim();

    if (
      !message ||
      !this.websocket ||
      this.websocket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const payload = {
      type: "send",
      message,
      user: {
        id: this.currentUser.id,
        name: this.currentUser.name,
      },
    };

    this.websocket.send(JSON.stringify(payload));
    input.value = "";
    input.focus();
  }

  onExitHandler() {
    if (
      !this.websocket ||
      this.websocket.readyState !== WebSocket.OPEN ||
      !this.currentUser
    ) {
      return;
    }

    this.websocket.send(
      JSON.stringify({
        type: "exit",
        user: {
          id: this.currentUser.id,
          name: this.currentUser.name,
        },
      }),
    );
  }

  showHint(text) {
    this.hint.textContent = text;
    this.hint.classList.remove("hidden");
  }

  hideHint() {
    this.hint.textContent = "";
    this.hint.classList.add("hidden");
  }
}
