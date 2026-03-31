// Test script to check which models are working
const MODELS = [
  'moonshotai/kimi-k2-thinking',
  'z-ai/glm4.7', 
  'z-ai/glm5',
  'minimaxai/minimax-m2.5',
  'qwen/qwen3-coder-480b-a35b-instruct',
];

const API_KEY = 'REDACTED_API_KEY_REMOVED';
const ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function testModel(modelId) {
  const start = Date.now();
  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: 'Say OK' },
          { role: 'user', content: 'Test' },
        ],
        temperature: 0.1,
        max_tokens: 5,
        stream: false,
      }),
    });

    const latency = Date.now() - start;

    if (!response.ok) {
      const error = await response.text();
      return { modelId, status: 'ERROR', latency, error: `${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content && content.length > 0) {
      return { modelId, status: 'OK', latency };
    } else {
      return { modelId, status: 'EMPTY', latency };
    }
  } catch (error) {
    return { modelId, status: 'EXCEPTION', latency: Date.now() - start, error: error.message };
  }
}

async function main() {
  console.log('Testing your 5 preferred models...\n');
  
  const results = await Promise.all(MODELS.map(testModel));
  
  results.forEach(result => {
    const icon = result.status === 'OK' ? '✅' : '❌';
    console.log(`${icon} ${result.modelId}`);
    console.log(`   Status: ${result.status} (${result.latency}ms)`);
    if (result.error) console.log(`   Error: ${result.error}`);
    console.log('');
  });

  const working = results.filter(r => r.status === 'OK');
  console.log(`\nWorking: ${working.length}/${MODELS.length}`);
  if (working.length > 0) {
    console.log('\nFastest to slowest:');
    working.sort((a, b) => a.latency - b.latency).forEach(m => {
      console.log(`  - ${m.modelId} (${m.latency}ms)`);
    });
  }
}

main().catch(console.error);
