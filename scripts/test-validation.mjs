/**
 * Validation System Test Script
 * 
 * Tests the complete validation pipeline:
 * 1. Model health checks
 * 2. Single phase execution
 * 3. Full 3-phase validation
 * 4. Score updates and streaming
 * 5. Error handling and failover
 * 
 * Usage: node --env-file=.env.local scripts/test-validation.mjs
 */

const http = require('http');

// Test configuration
const TEST_IDEAS = [
  'AI-powered startup validation platform',
  'No-code website builder for restaurants',
  'Subscription box for pet owners',
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

function timestamp() {
  return new Date().toISOString().split('T')[1].split('.')[0];
}

/**
 * Test 1: Model Health Check
 */
async function testModelHealth() {
  log(colors.cyan, '\n=== TEST 1: Model Health Check ===');
  
  const models = [
    'qwen/qwen3-coder-480b-a35b-instruct',
    'mistralai/mistral-large-3-675b-instruct-2512',
    'mistralai/mistral-small-4-119b-2603',
    'qwen/qwen3.5-122b-a10b',
  ];
  
  const results = await Promise.all(models.map(async (modelId) => {
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
        signal: AbortSignal.timeout(5000),
      });
      
      const latency = Date.now() - start;
      
      if (!res.ok) {
        return { modelId, status: 'ERROR', latency, error: res.status };
      }
      
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      
      return {
        modelId,
        status: content?.length > 0 ? 'OK' : 'EMPTY',
        latency,
      };
    } catch (err) {
      return { modelId, status: 'EXCEPTION', latency: Date.now() - start, error: err.message };
    }
  }));
  
  const working = results.filter(r => r.status === 'OK');
  
  log(colors.blue, '\nModel Results:');
  results.forEach(r => {
    const icon = r.status === 'OK' ? '✅' : '❌';
    log(colors.blue, `  ${icon} ${r.modelId}: ${r.status} (${r.latency}ms)`);
  });
  
  log(colors.green, `\nWorking models: ${working.length}/${models.length}`);
  if (working.length > 0) {
    log(colors.green, 'Ranked by speed:');
    working.sort((a, b) => a.latency - b.latency).forEach(m => {
      log(colors.green, `  - ${m.modelId} (${m.latency}ms)`);
    });
  }
  
  return working.length > 0;
}

/**
 * Test 2: Full Validation Pipeline
 */
async function testFullValidation(idea, index) {
  log(colors.cyan, `\n=== TEST ${index + 2}: Full Validation ===`);
  log(colors.yellow, `Idea: "${idea}"`);
  
  return new Promise((resolve) => {
    const data = JSON.stringify({ idea });
    const start = Date.now();
    let scores = [];
    let phases = [];
    let sections = [];
    let sectionScores = [];
    let resultId = null;
    let finalScore = null;
    let finalVerdict = null;
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/stream-analyze',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      
      res.on('data', chunk => {
        body += chunk;
        const lines = body.split('\n\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i];
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              const elapsed = ((Date.now() - start) / 1000).toFixed(1);
              
              if (event.type === 'score') {
                scores.push({ time: elapsed, value: event.value });
              } else if (event.type === 'phase') {
                phases.push({ time: elapsed, phase: event.phase, status: event.status });
              } else if (event.type === 'section') {
                sections.push({ time: elapsed, name: event.name });
              } else if (event.type === 'sectionScore') {
                sectionScores.push({ time: elapsed, section: event.section, score: event.score });
              } else if (event.type === 'complete') {
                resultId = event.resultId;
                finalScore = event.data?.score;
                finalVerdict = event.data?.verdict;
              }
            } catch {}
          }
        }
        
        body = lines[lines.length - 1];
      });
      
      res.on('end', () => {
        const total = ((Date.now() - start) / 1000).toFixed(1);
        
        log(colors.blue, '\nResults:');
        log(colors.blue, `  Total time: ${total}s`);
        log(colors.blue, `  Result ID: ${resultId}`);
        log(colors.blue, `  Final score: ${finalScore}`);
        log(colors.blue, `  Verdict: ${finalVerdict}`);
        log(colors.blue, `  Score updates: ${scores.length}`);
        scores.forEach(s => log(colors.blue, `    [${s.time}s] Score: ${s.value}`));
        log(colors.blue, `  Phase transitions: ${phases.length}`);
        phases.forEach(p => log(colors.blue, `    [${p.time}s] ${p.phase} ${p.status}`));
        log(colors.blue, `  Sections emitted: ${sections.length}`);
        sections.forEach(s => log(colors.blue, `    [${s.time}s] ${s.name}`));
        log(colors.blue, `  Section scores: ${sectionScores.length}`);
        sectionScores.forEach(s => log(colors.blue, `    [${s.time}s] ${s.section}: ${s.score}`));
        
        // Validate results
        const passed = finalScore !== null && resultId !== null && phases.length >= 6;
        
        if (passed) {
          log(colors.green, `  ✅ PASSED`);
        } else {
          log(colors.red, `  ❌ FAILED`);
          if (!finalScore) log(colors.red, `    - Missing final score`);
          if (!resultId) log(colors.red, `    - Missing result ID`);
          if (phases.length < 6) log(colors.red, `    - Expected 6+ phase transitions, got ${phases.length}`);
        }
        
        resolve(passed);
      });
    });
    
    req.on('error', err => {
      log(colors.red, `  ❌ Request error: ${err.message}`);
      resolve(false);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  log(colors.cyan, '\n🚀 Starting Validation System Tests\n');
  log(colors.cyan, `Time: ${timestamp()}`);
  
  const results = [];
  
  // Test 1: Model health
  const healthOk = await testModelHealth();
  results.push({ test: 'Model Health', passed: healthOk });
  
  if (!healthOk) {
    log(colors.red, '\n❌ Model health check failed. Skipping validation tests.');
    process.exit(1);
  }
  
  // Test 2-4: Full validation for each idea
  for (let i = 0; i < TEST_IDEAS.length; i++) {
    const passed = await testFullValidation(TEST_IDEAS[i], i + 1);
    results.push({ test: `Validation ${i + 1}`, passed });
    
    // Wait between tests to avoid rate limiting
    if (i < TEST_IDEAS.length - 1) {
      log(colors.yellow, '\nWaiting 5s before next test...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Summary
  log(colors.cyan, '\n=== TEST SUMMARY ===');
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    log(colors.cyan, `  ${icon} ${r.test}`);
  });
  
  log(colors.cyan, `\nTotal: ${passed}/${total} passed`);
  
  if (passed === total) {
    log(colors.green, '\n🎉 All tests passed!');
  } else {
    log(colors.red, '\n⚠️ Some tests failed');
  }
  
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  log(colors.red, 'Test runner error:', err);
  process.exit(1);
});
