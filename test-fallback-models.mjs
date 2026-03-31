const models = [
  // S-tier fallbacks from NVIDIA NIM
  'meta/llama-3.1-405b-instruct',
  'meta/llama-3.3-70b-instruct',
  'nvidia/llama-3.1-nemotron-ultra-253b-v1',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'mistralai/mistral-large-3-675b-instruct-2512',
  'mistralai/mistral-medium-3-instruct',
  'mistralai/mistral-small-4-119b-2603',
  'qwen/qwen3.5-122b-a10b',
];

async function testModel(modelId) {
  const start = Date.now();
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.NVIDIA_API_KEY,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: 'OK' },
          { role: 'user', content: 'Test' },
        ],
        max_tokens: 5,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(10000),
    });
    
    const latency = Date.now() - start;
    
    if (!res.ok) {
      const err = await res.text();
      return { modelId, status: 'ERROR', latency, error: res.status + ' ' + err.slice(0, 100) };
    }
    
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content && content.length > 0) {
      return { modelId, status: 'OK', latency, content: content.slice(0, 50) };
    } else {
      return { modelId, status: 'EMPTY', latency };
    }
  } catch (err) {
    return { modelId, status: 'EXCEPTION', latency: Date.now() - start, error: err.message };
  }
}

async function main() {
  console.log('Testing S-tier fallback models...\n');
  const results = await Promise.all(models.map(testModel));
  
  results.forEach(r => {
    const icon = r.status === 'OK' ? '✅' : '❌';
    console.log(icon + ' ' + r.modelId);
    console.log('   Status: ' + r.status + ' (' + r.latency + 'ms)');
    if (r.content) console.log('   Content: "' + r.content + '"');
    if (r.error) console.log('   Error: ' + r.error);
    console.log('');
  });
  
  const working = results.filter(r => r.status === 'OK');
  console.log('\nWorking: ' + working.length + '/' + models.length);
  if (working.length > 0) {
    console.log('\nRanked by speed:');
    working.sort((a, b) => a.latency - b.latency).forEach(m => {
      console.log('  - ' + m.modelId + ' (' + m.latency + 'ms)');
    });
  }
}

main().catch(console.error);
