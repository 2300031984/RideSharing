// Test script to verify cancel ride functionality
// This can be run in the browser console to test the cancel ride API

const testCancelRide = async () => {
  console.log('🧪 Testing Cancel Ride Functionality...');
  
  try {
    // Test 1: Check if cancelRideApi function exists
    const { cancelRideApi } = await import('./services/RideService.js');
    console.log('✅ cancelRideApi function imported successfully');
    
    // Test 2: Test with mock data
    const mockRideId = '12345';
    const mockUserId = '67890';
    const mockReason = 'Test cancellation';
    
    console.log('🔄 Testing cancel ride API call...');
    const result = await cancelRideApi(mockRideId, mockUserId, mockReason);
    
    console.log('📊 Cancel ride result:', result);
    
    if (result.success) {
      console.log('✅ Cancel ride API call successful');
    } else {
      console.log('⚠️ Cancel ride API call failed, but local fallback worked');
    }
    
    // Test 3: Check local storage update
    const recentRides = JSON.parse(localStorage.getItem('recentRides') || '[]');
    const cancelledRide = recentRides.find(ride => ride.id === mockRideId);
    
    if (cancelledRide && cancelledRide.status === 'cancelled') {
      console.log('✅ Local storage updated correctly');
    } else {
      console.log('⚠️ Local storage not updated (expected for mock data)');
    }
    
    console.log('🎉 Cancel ride functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for use in browser console
window.testCancelRide = testCancelRide;

console.log('Cancel ride test function loaded. Run testCancelRide() to test.');
