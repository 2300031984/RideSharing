// Test Script for Saved Places CRUD Operations
// Run this with: node test-saved-places.js

const API_URL = 'http://localhost:8081';

// Test data
let testUserId = 1; // Change this to match your user ID
let testPlaceId = null;

// Helper function to make requests
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`\n${method} ${endpoint}`);
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error('Error:', error.message);
    return { error };
  }
}

// Test functions
async function testCreatePlace() {
  console.log('\n========== TEST 1: CREATE SAVED PLACE ==========');
  
  const placeData = {
    name: 'Test Home',
    address: '123 Test Street, Test City',
    latitude: 12.9716,
    longitude: 77.5946,
    type: 'home'
  };
  
  const { data } = await makeRequest(`/api/saved-places/${testUserId}`, 'POST', placeData);
  
  if (data && data.success && data.data) {
    testPlaceId = data.data.id;
    console.log('✅ Place created successfully with ID:', testPlaceId);
    return true;
  } else {
    console.log('❌ Failed to create place');
    return false;
  }
}

async function testGetPlaces() {
  console.log('\n========== TEST 2: GET ALL SAVED PLACES ==========');
  
  const { data } = await makeRequest(`/api/saved-places/${testUserId}`, 'GET');
  
  if (data && Array.isArray(data)) {
    console.log(`✅ Retrieved ${data.length} saved places`);
    return true;
  } else {
    console.log('❌ Failed to retrieve places');
    return false;
  }
}

async function testUpdatePlace() {
  console.log('\n========== TEST 3: UPDATE SAVED PLACE ==========');
  
  if (!testPlaceId) {
    console.log('❌ No place ID available for update test');
    return false;
  }
  
  const updatedData = {
    name: 'Updated Test Home',
    address: '456 Updated Street, New City',
    latitude: 13.0000,
    longitude: 78.0000,
    type: 'work'
  };
  
  const { data } = await makeRequest(`/api/saved-places/${testPlaceId}`, 'PUT', updatedData);
  
  if (data && data.success && data.data) {
    console.log('✅ Place updated successfully');
    console.log('Updated name:', data.data.name);
    console.log('Updated address:', data.data.address);
    console.log('Updated type:', data.data.type);
    return true;
  } else {
    console.log('❌ Failed to update place');
    return false;
  }
}

async function testDeletePlace() {
  console.log('\n========== TEST 4: DELETE SAVED PLACE ==========');
  
  if (!testPlaceId) {
    console.log('❌ No place ID available for delete test');
    return false;
  }
  
  const { data } = await makeRequest(`/api/saved-places/${testPlaceId}`, 'DELETE');
  
  if (data && data.success) {
    console.log('✅ Place deleted successfully');
    return true;
  } else {
    console.log('❌ Failed to delete place');
    return false;
  }
}

async function testUpdateNonExistent() {
  console.log('\n========== TEST 5: UPDATE NON-EXISTENT PLACE (Should Fail) ==========');
  
  const fakeId = 99999;
  const updatedData = {
    name: 'Should Fail',
    address: 'Should Fail Address',
    type: 'other'
  };
  
  const { data, response } = await makeRequest(`/api/saved-places/${fakeId}`, 'PUT', updatedData);
  
  if (response.status >= 400 && data && !data.success) {
    console.log('✅ Correctly returned error for non-existent place');
    return true;
  } else {
    console.log('❌ Should have returned error');
    return false;
  }
}

async function testDeleteNonExistent() {
  console.log('\n========== TEST 6: DELETE NON-EXISTENT PLACE (Should Fail) ==========');
  
  const fakeId = 99999;
  const { data, response } = await makeRequest(`/api/saved-places/${fakeId}`, 'DELETE');
  
  if (response.status >= 400 && data && !data.success) {
    console.log('✅ Correctly returned error for non-existent place');
    return true;
  } else {
    console.log('❌ Should have returned error');
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   SAVED PLACES API TEST SUITE                  ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const results = [];
  
  results.push(await testCreatePlace());
  results.push(await testGetPlaces());
  results.push(await testUpdatePlace());
  results.push(await testGetPlaces()); // Verify update
  results.push(await testDeletePlace());
  results.push(await testGetPlaces()); // Verify deletion
  results.push(await testUpdateNonExistent());
  results.push(await testDeleteNonExistent());
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                  ║');
  console.log('╚════════════════════════════════════════════════╝');
  
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(2)}%`);
}

// Execute tests
runAllTests().catch(console.error);
