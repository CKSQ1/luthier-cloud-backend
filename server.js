/**
 * THE LUTHIER — Cloud Backend
 * Handles Claude API calls with tool relay to the editor's local CEP panel.
 *
 * Protocol:
 *   1. CEP panel POSTs { message, history } to /api/chat
 *   2. Server calls Claude with tools
 *   3. If Claude wants to use tools: respond with { tool_calls, done: false }
 *   4. CEP panel executes tools locally, POSTs back { tool_results, history }
 *   5. Server sends tool results to Claude, loops until done
 *   6. When done: respond with { text, done: true }
 */

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const { TOOLS } = require('./tools');
const { SYSTEM_PROMPT } = require('./system-prompt');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-opus-4-6';
const MAX_TOKENS = 4096;

// Increase server timeout for long Claude API calls
const SERVER_TIMEOUT = 120000; // 2 minutes

// ============================================================
// Health endpoint
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'luthier-cloud-backend',
    model: MODEL,
    tools: TOOLS.length,
  });
});

// ============================================================
// Chat endpoint — handles the Claude conversation with tool relay
// ============================================================

app.post('/api/chat', async (req, res) => {
  const { message, history, tool_results } = req.body;

  try {
    // Build messages array
    let messages = history ? [...history] : [];

    // If this is a new user message (not a tool result return)
    if (message) {
      messages.push({ role: 'user', content: message });
    }

    // If we're receiving tool results from the CEP panel
    if (tool_results && Array.isArray(tool_results)) {
      // The last message in history should be the assistant's tool_use response
      // We need to add a user message with tool_result blocks
      const toolResultBlocks = tool_results.map(tr => ({
        type: 'tool_result',
        tool_use_id: tr.id,
        content: typeof tr.result === 'string' ? tr.result : JSON.stringify(tr.result),
      }));

      messages.push({ role: 'user', content: toolResultBlocks });
    }

    // Trim history to avoid token limits (keep system + last 40 messages)
    if (messages.length > 40) {
      messages = messages.slice(messages.length - 40);
    }

    // Call Claude
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: messages,
    });

    // Process response
    const textBlocks = [];
    const toolCalls = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        textBlocks.push(block.text);
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input,
        });
      }
    }

    const text = textBlocks.join('\n');
    const done = response.stop_reason === 'end_turn';

    // Build the assistant message for history
    const assistantMessage = { role: 'assistant', content: response.content };

    // Return updated history so CEP panel can send it back with tool results
    const updatedHistory = [...messages, assistantMessage];

    res.json({
      text,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      done,
      history: updatedHistory,
      usage: response.usage,
    });

  } catch (err) {
    console.error('Claude API error:', err.message);
    res.status(500).json({
      error: err.message,
      done: true,
    });
  }
});

// ============================================================
// Start server
// ============================================================

const PORT = process.env.PORT || 3849;

const server = app.listen(PORT, () => {
  console.log(`THE LUTHIER cloud backend running on port ${PORT}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Tools: ${TOOLS.length}`);
  console.log(`API Key: ${process.env.ANTHROPIC_API_KEY ? 'configured' : 'MISSING!'}`);
});
server.timeout = SERVER_TIMEOUT;
server.keepAliveTimeout = SERVER_TIMEOUT;
