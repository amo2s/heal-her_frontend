// === DOM Elements ===
const DOM = {
  hamburgerMenu: document.querySelector('.hamburger-menu'),
  newChatBtn: document.querySelector('.new-chat'),
  newChatModal: document.getElementById('newChatModal'),
  confirmBtn: document.querySelector('.confirm-btn'),
  cancelBtn: document.querySelector('.cancel-btn'),
  infoButton: document.querySelector('.info-icon'),
  infoModal: document.getElementById('infoModal'),
  comingSoonModal: document.getElementById('comingSoonModal'),
  modalCloses: document.querySelectorAll('.modal-close'),
  userInput: document.getElementById('userInput'),
  sendButton: document.querySelector('.send-button'),
  imageButton: document.querySelector('.image-button'),
  micButton: document.querySelector('.mic-button'),
  chat: document.getElementById('chat'),
  backgroundMessage: document.getElementById('backgroundMessage'),
};

// === Backend Config ===
const AI_CONFIG = {
    endpoint: 'http://127.0.0.1:8000/chat', // your backend
    systemPrompt: '' // backend already has SYSTEM_PROMPT
};


// === State Variables ===
let isSending = false;
let chatHistory = [];

// === Modal and UI Functions ===
const toggleModal = (modal, show) => {
  modal.style.display = show ? 'flex' : 'none';
  modal.setAttribute('aria-hidden', show ? 'false' : 'true');
  document.body.style.overflow = show ? 'hidden' : 'auto';
  if (show) {
    const focusable = modal.querySelector('.modal-content');
    if (focusable) focusable.focus();
  }
};

const handleEscClose = (e) => {
  if (e.key === 'Escape') {
    [DOM.infoModal, DOM.newChatModal, DOM.comingSoonModal].forEach((modal) =>
      toggleModal(modal, false)
    );
  }
};

const resetBackgroundMessage = () => {
  if (!DOM.chat.querySelector('#backgroundMessage')) {
    const newBackgroundMessageDiv = document.createElement('div');
    newBackgroundMessageDiv.className = 'background-message';
    newBackgroundMessageDiv.id = 'backgroundMessage';
    newBackgroundMessageDiv.textContent = 'How can I assist you today?';
    DOM.chat.appendChild(newBackgroundMessageDiv);
    newBackgroundMessageDiv.style.display = 'block';
    newBackgroundMessageDiv.classList.remove('fade-out');
  }
};

// === Chat Functions ===
const createMessage = (text, type = 'bot') => {
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  const content = document.createElement('div');
  content.textContent = type === 'user' ? text : 'Thinking...';
  msg.appendChild(content);
  const timestamp = document.createElement('div');
  timestamp.className = 'message-timestamp';
  timestamp.textContent = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  msg.appendChild(timestamp);
  DOM.chat.appendChild(msg);
  scrollToBottom();
  return { msg, content };
};

const scrollToBottom = () => {
  DOM.chat.scrollTo({ top: DOM.chat.scrollHeight, behavior: 'smooth' });
};

const formatMessageText = (rawText) => {
  const escaped = rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let formatted = escaped
    .replace(/\\(.?)\\*/g, '<strong>$1</strong>')
    .replace(/(^|\n)\d+\.\s(.*?)(?=\n|$)/g, '<li>$2</li>')
    .replace(/(^|\n)[-]\s(.?)(?=\n|$)/g, '<li>$2</li>')
    .replace(/(<li>.*?<\/li>)/gs, "<ul class='chat-list'>$1</ul>")
    .replace(/\n+/g, '<br><br>');
  return `<div class="chat-text">${formatted}</div>`;
};

// === Typewriter Queue System ===
const typeQueue = [];
let isTyping = false;

const enqueueBotReply = (contentDiv, reply) => {
  typeQueue.push({ contentDiv, reply });
  processQueue();
};

const processQueue = async () => {
  if (isTyping || typeQueue.length === 0) return;
  isTyping = true;

  const { contentDiv, reply } = typeQueue.shift();
  const formattedReply = formatMessageText(reply);
  await typeWriterHTMLAsync(contentDiv, formattedReply);

  isTyping = false;
  processQueue();
};

const typeWriterHTMLAsync = (container, html, speed = 20) => {
  return new Promise((resolve) => {
    container.innerHTML = '';
    const temp = document.createElement('div');
    temp.innerHTML = html;

    const processNode = (node, parent, done) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const span = document.createElement('span');
        parent.appendChild(span);
        let i = 0;
        const typeChar = () => {
          if (i < text.length) {
            span.textContent += text[i++];
            setTimeout(typeChar, speed);
          } else {
            done();
          }
        };
        typeChar();
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = document.createElement(node.tagName);
        for (let attr of node.attributes) el.setAttribute(attr.name, attr.value);
        parent.appendChild(el);

        const children = Array.from(node.childNodes);
        let index = 0;

        const nextChild = () => {
          if (index < children.length) {
            processNode(children[index++], el, nextChild);
          } else {
            done();
          }
        };
        nextChild();
      }
    };

    const children = Array.from(temp.childNodes);
    let i = 0;

    const nextNode = () => {
      if (i < children.length) {
        processNode(children[i++], container, nextNode);
      } else {
        resolve();
      }
    };

    nextNode();
  });
};

// === AI Logic (backend-safe) ===
const sendUserMessage = (text) => {
  chatHistory.push({ role: 'user', content: text });
  return createMessage(text, 'user');
};

const fetchAIResponse = async (userMessage) => {
  try {
    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_message: userMessage }),
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error(error);
    return 'Error: Could not get a response. Please try again later.';
  }
};

// ✨ Bot typing using queue
const handleSendMessage = async () => {
  if (isSending || !DOM.userInput.value.trim()) return;
  isSending = true;
  DOM.sendButton.disabled = true;

  if (DOM.backgroundMessage.style.display !== 'none') {
    DOM.backgroundMessage.classList.add('fade-out');
    DOM.backgroundMessage.addEventListener(
      'transitionend',
      () => {
        DOM.backgroundMessage.style.display = 'none';
      },
      { once: true }
    );
  }

  const userMessageText = DOM.userInput.value.trim();
  DOM.userInput.value = '';
  const { content: userContent } = sendUserMessage(userMessageText);
  const { msg: botMessage, content: botContent } = createMessage('Thinking...', 'bot');

  const reply = await fetchAIResponse(userMessageText);
  enqueueBotReply(botContent, reply);

  isSending = false;
  DOM.sendButton.disabled = false;
  scrollToBottom();
};

// === Event Listeners ===
const setupEventListeners = () => {
  DOM.infoButton.addEventListener('click', () => toggleModal(DOM.infoModal, true));
  DOM.hamburgerMenu.addEventListener('click', () => toggleModal(DOM.comingSoonModal, true));
  DOM.newChatBtn.addEventListener('click', () => toggleModal(DOM.newChatModal, true));
  DOM.cancelBtn.addEventListener('click', () => toggleModal(DOM.newChatModal, false));
  DOM.modalCloses.forEach((btn) =>
    btn.addEventListener('click', () => {
      [DOM.infoModal, DOM.newChatModal, DOM.comingSoonModal].forEach((modal) =>
        toggleModal(modal, false)
      );
    })
  );

  DOM.sendButton.addEventListener('click', handleSendMessage);
  DOM.imageButton.addEventListener('click', () => toggleModal(DOM.comingSoonModal, true));
  DOM.micButton.addEventListener('click', () => toggleModal(DOM.comingSoonModal, true));

  DOM.userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  DOM.confirmBtn.addEventListener('click', () => {
    toggleModal(DOM.newChatModal, false);
    DOM.chat.innerHTML = '';
    chatHistory = [];
    resetBackgroundMessage();
  });

  document.addEventListener('keydown', handleEscClose);
};

// === Initialize ===
setupEventListeners();
