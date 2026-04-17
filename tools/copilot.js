import WebSocket from 'ws';

const sessions = new Map();

class Copilot {
  constructor() {
    this.conversationId = null;
    this.models = {
      default: 'chat',
      'think-deeper': 'reasoning',
      'gpt-5': 'smart'
    };
    this.headers = {
      origin: 'https://copilot.microsoft.com',
      'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36',
      'content-type': 'application/json'
    };
  }

  async createConversation() {
    const res = await fetch('https://copilot.microsoft.com/c/api/conversations', {
      method: 'POST',
      headers: this.headers
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    const data = await res.json();
    this.conversationId = data.id;
    return this.conversationId;
  }

  async ask(message, options = {}) {
    const { model = 'default', sessionId = 'default' } = options;
    if (!this.conversationId) await this.createConversation();

    if (!sessions.has(sessionId)) sessions.set(sessionId, []);
    const history = sessions.get(sessionId);

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(
        'wss://copilot.microsoft.com/c/api/chat?api-version=2&features=-,ncedge,edgepagecontext&setflight=-,ncedge,edgepagecontext&ncedge=1',
        { headers: this.headers }
      );

      let responseText = '';
      const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) ws.close();
        reject(new Error('Timeout'));
      }, 20000);

      ws.on('open', () => {
        ws.send(JSON.stringify({
          event: 'setOptions',
          supportedFeatures: ['partial-generated-images'],
          supportedCards: ['weather', 'local', 'image', 'sports', 'video', 'ads', 'safetyHelpline', 'quiz', 'finance', 'recipe'],
          ads: { supportedTypes: ['text', 'product', 'multimedia', 'tourActivity', 'propertyPromotion'] }
        }));

        const system = 'Responde breve y conciso. Solo formato WhatsApp (*negrita*, _cursiva_). Sin # ni listas.';
        const context = history.map((h) => `User: ${h.q}\nAI: ${h.a}`).join('\n');
        const fullPrompt = `${system}\n\n${context}\nUser: ${message}`;

        ws.send(JSON.stringify({
          event: 'send',
          mode: this.models[model] || 'chat',
          conversationId: this.conversationId,
          content: [{ type: 'text', text: fullPrompt }],
          context: {}
        }));
      });

      ws.on('message', (chunk) => {
        try {
          const parsed = JSON.parse(chunk.toString());

          if (parsed.event === 'appendText') {
            responseText += parsed.text || '';
          }

          if (parsed.event === 'done') {
            clearTimeout(timeout);

            const cleanText = responseText
              .replace(/[#*]{2,}/g, '*')
              .replace(/###/g, '')
              .replace(/^- /gm, '• ')
              .trim();

            history.push({ q: message, a: cleanText });
            if (history.length > 5) history.shift();

            resolve({
              status: true,
              text: cleanText,
              sessionId
            });

            ws.close();
          }
        } catch (e) {}
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      ws.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }
}

export { Copilot };
