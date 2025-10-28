const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

async function testRateLimiting() {
  console.log('🧪 Testing Rate Limiting Implementation...\n');

  // Test health endpoint (should allow 100 requests per second)
  console.log('1. Testing Health Endpoint (100 req/sec limit)...');
  try {
    const healthPromises = Array.from({ length: 5 }, () =>
      axios.get(`${BASE_URL}/health`),
    );
    const healthResults = await Promise.all(healthPromises);
    console.log(
      `✅ Health endpoint: ${healthResults.length} requests succeeded`,
    );
  } catch (error) {
    console.log(
      `❌ Health endpoint error: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
    );
  }

  // Test single telemetry ingestion (50 requests per second limit)
  console.log('\n2. Testing Single Telemetry Ingestion (50 req/sec limit)...');
  const telemetryData = {
    deviceId: 'test-device-001',
    category: 'power',
    value: 150.5,
    status: true,
    timestamp: new Date().toISOString(),
  };

  try {
    const telemetryPromises = Array.from({ length: 3 }, () =>
      axios.post(`${BASE_URL}/telemetry/ingest`, telemetryData),
    );
    const telemetryResults = await Promise.all(telemetryPromises);
    console.log(
      `✅ Single telemetry: ${telemetryResults.length} requests succeeded`,
    );
  } catch (error) {
    console.log(
      `❌ Single telemetry error: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
    );
  }

  // Test batch telemetry ingestion (20 requests per 10 seconds limit)
  console.log('\n3. Testing Batch Telemetry Ingestion (20 req/10sec limit)...');
  const batchData = {
    data: [
      { ...telemetryData, deviceId: 'batch-device-001' },
      { ...telemetryData, deviceId: 'batch-device-002' },
    ],
  };

  try {
    const batchResult = await axios.post(
      `${BASE_URL}/telemetry/ingest/batch`,
      batchData,
    );
    console.log(`✅ Batch telemetry: Request succeeded`);
  } catch (error) {
    console.log(
      `❌ Batch telemetry error: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
    );
  }

  // Test cleanup endpoint (5 requests per minute limit)
  console.log('\n4. Testing Cleanup Endpoint (5 req/min limit)...');
  try {
    const cleanupResult = await axios.post(
      `${BASE_URL}/telemetry/cleanup?daysToKeep=30`,
    );
    console.log(`✅ Cleanup endpoint: Request succeeded`);
  } catch (error) {
    console.log(
      `❌ Cleanup endpoint error: ${error.response?.status} - ${error.response?.data?.message || error.message}`,
    );
  }

  console.log('\n🎉 Rate limiting test completed!');
  console.log('\n📋 Rate Limiting Configuration Summary:');
  console.log('• Global defaults: 10 req/sec, 50 req/10sec, 200 req/min');
  console.log('• Health endpoint: 100 req/sec');
  console.log('• Single telemetry: 50 req/sec');
  console.log('• Batch telemetry: 20 req/10sec');
  console.log('• Device stats: 30 req/10sec');
  console.log('• Device readings: 40 req/10sec');
  console.log('• Cleanup endpoint: 5 req/min');
  console.log('• Legacy endpoint: 25 req/10sec');
}

// Run the test
testRateLimiting().catch(console.error);
