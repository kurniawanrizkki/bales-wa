/**
 * 9Router completions integration (OpenAI compatible API)
 */
async function generateAIReply({ apiKey, baseUrl, model, systemPrompt, userMessage, conversationHistory = [] }) {
  const activeKey = apiKey || process.env.ROUTER9_API_KEY;
  if (!activeKey) {
    throw new Error('API key 9Router belum dikonfigurasi.');
  }

  const endpoint = (baseUrl || process.env.ROUTER9_BASE_URL || 'https://api.9router.com/v1').replace(/\/+$/, '') + '/chat/completions';
  const selectedModel = model || process.env.ROUTER9_DEFAULT_MODEL || 'openai/gpt-4o-mini';

  const messages = [
    {
      role: 'system',
      content: systemPrompt || 'Kamu adalah asisten UMKM yang ramah dan solutif.'
    },
    ...conversationHistory.slice(-6), // max 3 round-trip context
    {
      role: 'user',
      content: userMessage
    }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 600,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      // Auto-fallback if requested model fails/quota reached (e.g. 3.5 exhausted/unavailable -> fallback to 3.8)
      if (!response.ok && selectedModel !== 'ag/gemini-3.8-flash-medium') {
        console.warn(`[9Router] Model ${selectedModel} gagal (HTTP ${response.status}), otomatis fallback ke ag/gemini-3.8-flash-medium`);
        return generateAIReply({
          apiKey,
          baseUrl,
          model: 'ag/gemini-3.8-flash-medium',
          systemPrompt,
          userMessage,
          conversationHistory
        });
      }
      throw new Error(`9Router [HTTP ${response.status}]: ${errorText}`);
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('Jawaban dari 9Router kosong.');
    }

    return reply.trim();
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

module.exports = {
  generateAIReply
};
