// Profile Management API Examples
// Use these examples to test the profile management endpoints

const BASE_URL = 'http://localhost:8080/api/profile';

// Example 1: Get Rider Profile
async function getRiderProfile(userId) {
    try {
        const response = await fetch(`${BASE_URL}/${userId}?role=RIDER`);
        const profile = await response.json();
        console.log('Rider Profile:', profile);
        return profile;
    } catch (error) {
        console.error('Error getting rider profile:', error);
    }
}

// Example 2: Get Driver Profile
async function getDriverProfile(userId) {
    try {
        const response = await fetch(`${BASE_URL}/${userId}?role=DRIVER`);
        const profile = await response.json();
        console.log('Driver Profile:', profile);
        return profile;
    } catch (error) {
        console.error('Error getting driver profile:', error);
    }
}

// Example 3: Update Rider Profile
async function updateRiderProfile(userId, profileData) {
    try {
        const response = await fetch(`${BASE_URL}/${userId}?role=RIDER`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });
        const updatedProfile = await response.json();
        console.log('Updated Rider Profile:', updatedProfile);
        return updatedProfile;
    } catch (error) {
        console.error('Error updating rider profile:', error);
    }
}

// Example 4: Update Driver Profile
async function updateDriverProfile(userId, profileData) {
    try {
        const response = await fetch(`${BASE_URL}/${userId}?role=DRIVER`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });
        const updatedProfile = await response.json();
        console.log('Updated Driver Profile:', updatedProfile);
        return updatedProfile;
    } catch (error) {
        console.error('Error updating driver profile:', error);
    }
}

// Example 5: Partial Update Profile
async function partialUpdateProfile(userId, role, profileData) {
    try {
        const response = await fetch(`${BASE_URL}/${userId}?role=${role}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });
        const updatedProfile = await response.json();
        console.log('Partially Updated Profile:', updatedProfile);
        return updatedProfile;
    } catch (error) {
        console.error('Error partially updating profile:', error);
    }
}

// Example 6: Check Profile Existence
async function checkProfileExists(userId, role) {
    try {
        const response = await fetch(`${BASE_URL}/${userId}/exists?role=${role}`);
        const result = await response.json();
        console.log(`Profile exists for user ${userId} with role ${role}:`, result.exists);
        return result.exists;
    } catch (error) {
        console.error('Error checking profile existence:', error);
    }
}

// Example 7: Get Profile by Email
async function getProfileByEmail(email, role) {
    try {
        const response = await fetch(`${BASE_URL}/email/${email}?role=${role}`);
        const profile = await response.json();
        console.log('Profile by Email:', profile);
        return profile;
    } catch (error) {
        console.error('Error getting profile by email:', error);
    }
}

// Usage Examples
async function runExamples() {
    console.log('=== Profile Management API Examples ===\n');

    // Example 1: Get profiles
    console.log('1. Getting Rider Profile:');
    await getRiderProfile(1);

    console.log('\n2. Getting Driver Profile:');
    await getDriverProfile(1);

    // Example 2: Update profiles
    console.log('\n3. Updating Rider Profile:');
    const riderUpdateData = {
        username: 'john_doe_updated',
        phone: '+1234567890',
        age: 26,
        location: 'New York',
        avatar: 'https://example.com/avatar.jpg'
    };
    await updateRiderProfile(1, riderUpdateData);

    console.log('\n4. Updating Driver Profile:');
    const driverUpdateData = {
        name: 'Jane Smith',
        licenseNumber: 'DL123456789',
        status: 'ONLINE'
    };
    await updateDriverProfile(1, driverUpdateData);

    // Example 3: Partial updates
    console.log('\n5. Partial Update (Rider):');
    const partialRiderData = {
        phone: '+9876543210',
        location: 'Los Angeles'
    };
    await partialUpdateProfile(1, 'RIDER', partialRiderData);

    // Example 4: Check existence
    console.log('\n6. Checking Profile Existence:');
    await checkProfileExists(1, 'RIDER');
    await checkProfileExists(1, 'DRIVER');

    // Example 5: Get by email
    console.log('\n7. Getting Profile by Email:');
    await getProfileByEmail('john@example.com', 'RIDER');
}

// Run examples if this file is executed directly
if (typeof window === 'undefined') {
    runExamples();
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getRiderProfile,
        getDriverProfile,
        updateRiderProfile,
        updateDriverProfile,
        partialUpdateProfile,
        checkProfileExists,
        getProfileByEmail,
        runExamples
    };
}
