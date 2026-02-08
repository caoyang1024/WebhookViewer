// Usage: node stress-test.mjs [baseUrl]
const BASE = process.argv[2] || 'http://localhost:5000';

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.status;
}

function report(name, ok, fail, ms, msgCount) {
  const rps = (msgCount / (ms / 1000)).toFixed(1);
  console.log(`  ${ok} ok, ${fail} failed | ${ms}ms | ${rps} msgs/s`);
  console.log();
}

async function run() {
  console.log(`=== Webhook Ingestion Stress Test: ${BASE} ===\n`);

  // Test 1: 5,000 sequential single-message POSTs
  console.log('--- Test 1: 5,000 sequential POSTs ---');
  let ok = 0, fail = 0, t = Date.now();
  for (let i = 0; i < 5000; i++) {
    const s = await post(`${BASE}/api/webhook/stress-seq`, { message: `seq ${i}`, level: 'Information' });
    s === 200 ? ok++ : fail++;
  }
  report('Test 1', ok, fail, Date.now() - t, 5000);

  // Test 2: 10,000 concurrent (100 batches x 100 parallel)
  console.log('--- Test 2: 10,000 concurrent POSTs (100 waves x 100 parallel) ---');
  ok = 0; fail = 0; t = Date.now();
  for (let batch = 0; batch < 100; batch++) {
    const promises = Array.from({ length: 100 }, (_, j) =>
      post(`${BASE}/api/webhook/stress-conc`, { message: `conc ${batch}-${j}`, level: 'Warning' })
    );
    const results = await Promise.all(promises);
    for (const s of results) s === 200 ? ok++ : fail++;
  }
  report('Test 2', ok, fail, Date.now() - t, 10000);

  // Test 3: 10,000 messages via batch payloads (200 POSTs x 50 messages each)
  console.log('--- Test 3: 10,000 messages via batch arrays (200 POSTs x 50 msgs) ---');
  ok = 0; fail = 0; t = Date.now();
  let totalMsgs = 0;
  for (let i = 0; i < 200; i++) {
    const batch = Array.from({ length: 50 }, (_, j) => ({ message: `batch ${i}-${j}`, level: 'Debug' }));
    const s = await post(`${BASE}/api/webhook/stress-batch`, batch);
    if (s === 200) { ok++; totalMsgs += 50; } else { fail++; }
  }
  report('Test 3', ok, fail, Date.now() - t, totalMsgs);

  // Test 4: Sustained burst — 50 concurrent x 50 messages each, 10 waves = 25,000 messages
  console.log('--- Test 4: Sustained burst (10 waves x 50 concurrent x 50 msgs = 25,000 msgs) ---');
  ok = 0; fail = 0; totalMsgs = 0; t = Date.now();
  for (let wave = 0; wave < 10; wave++) {
    const promises = Array.from({ length: 50 }, (_, j) => {
      const batch = Array.from({ length: 50 }, (_, k) => ({ message: `burst ${wave}-${j}-${k}`, level: 'Error' }));
      return post(`${BASE}/api/webhook/stress-burst`, batch);
    });
    const results = await Promise.all(promises);
    for (const s of results) {
      if (s === 200) { ok++; totalMsgs += 50; } else { fail++; }
    }
  }
  report('Test 4', ok, fail, Date.now() - t, totalMsgs);

  console.log('=== Done ===');
}

run().catch(console.error);
