// === DOM Elements ===
const DOM = {
  userInput: document.getElementById('userInput'),
  sendButton: document.querySelector('.send-button'),
  chat: document.getElementById('chat'),
  backgroundMessage: document.getElementById('backgroundMessage'),
};

// === Backend Config ===
const AI_CONFIG = {
  endpoint: 'http://127.0.0.1:8000/chat', // Local backend
};

// === State Variables ===
let isSending = false;
const typeQueue = [];
let isTyping = false;

// === Utility: Scroll chat to bottom ===
const scrollToBottom = () => {
  DOM.chat.scrollTo({ top: DOM.chat.scrollHeight, behavior: 'smooth' });
};

// === Create message DOM element ===
const createMessage = (text, type = 'bot') => {
  const msg = document.createElement('div');
  msg.className = `message ${type}`;
  const content = document.createElement('div');
  content.textContent = type === 'user' ? text : 'Thinking...';
  msg.appendChild(content);
  const timestamp = document.createElement('div');
  timestamp.className = 'message-timestamp';
  timestamp.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  msg.appendChild(timestamp);
  DOM.chat.appendChild(msg);
  scrollToBottom();
  return { msg, content };
};

// === Typewriter effect ===
const enqueueBotReply = (contentDiv, reply) => {
  typeQueue.push({ contentDiv, reply });
  processQueue();
};

const processQueue = async () => {
  if (isTyping || typeQueue.length === 0) return;
  isTyping = true;

  const { contentDiv, reply } = typeQueue.shift();
  contentDiv.textContent = '';
  for (let i = 0; i < reply.length; i++) {
    contentDiv.textContent += reply[i];
    await new Promise(r => setTimeout(r, 20)); // typing speed
  }

  isTyping = false;
  processQueue();
};

// === Fetch AI response from backend ===
const fetchAIResponse = async (userMessage) => {
  try {
    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_message: userMessage }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Fetch error:', error);
    return 'Error: Could not get a response. Check if your backend is running.';
  }
};

// === Handle sending message ===
const handleSendMessage = async () => {
  if (isSending || !DOM.userInput.value.trim()) return;
  isSending = true;
  DOM.sendButton.disabled = true;

  if (DOM.backgroundMessage && DOM.backgroundMessage.style.display !== 'none') {
    DOM.backgroundMessage.style.display = 'none';
  }

  const userMessage = DOM.userInput.value.trim();
  DOM.userInput.value = '';
  createMessage(userMessage, 'user');

  const { content: botContent } = createMessage('Thinking...', 'bot');
  const reply = await fetchAIResponse(userMessage);
  enqueueBotReply(botContent, reply);

  isSending = false;
  DOM.sendButton.disabled = false;
  scrollToBottom();
};

// === Event Listeners ===
DOM.sendButton.addEventListener('click', handleSendMessage);
DOM.userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSendMessage();
  }
});
