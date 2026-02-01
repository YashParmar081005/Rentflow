const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const testAPI = async () => {
    try {
        console.log('1. Testing Health Check...');
        try {
            const res = await axios.get('http://localhost:5000/');
            console.log('✅ Server is running:', res.data);
        } catch (e) {
            console.log('❌ Server is NOT running');
            return;
        }

        // 2. Signup Vendor
        console.log('\n2. Testing Vendor Signup...');
        const vendorEmail = `vendor_${Date.now()}@test.com`;
        const vendorRes = await axios.post(`${API_URL}/auth/signup`, {
            name: 'Test Vendor',
            email: vendorEmail,
            password: 'password123',
            role: 'vendor',
            company: 'Test Co'
        });
        console.log('✅ Vendor Signed Up:', vendorRes.data.email);
        const vendorToken = vendorRes.data.token;

        // 3. Create Product
        console.log('\n3. Testing Product Creation...');
        const productRes = await axios.post(`${API_URL}/products`, {
            name: 'Test Excavator',
            description: 'Heavy duty',
            category: 'Heavy Equipment',
            stock: 5,
            dailyRate: 1000,
            images: ['http://example.com/img.jpg']
        }, {
            headers: { Authorization: `Bearer ${vendorToken}` }
        });
        console.log('✅ Product Created:', productRes.data.name);
        const productId = productRes.data._id;

        // 4. Signup Customer
        console.log('\n4. Testing Customer Signup...');
        const customerEmail = `customer_${Date.now()}@test.com`;
        const customerRes = await axios.post(`${API_URL}/auth/signup`, {
            name: 'Test Customer',
            email: customerEmail,
            password: 'password123',
            role: 'customer'
        });
        console.log('✅ Customer Signed Up:', customerRes.data.email);
        const customerToken = customerRes.data.token;

        // 5. Place Order
        console.log('\n5. Testing Order Placement...');
        const orderRes = await axios.post(`${API_URL}/orders`, {
            items: [{
                productId: productId,
                productName: 'Test Excavator',
                quantity: 1,
                dailyRate: 1000,
                subtotal: 1000
            }],
            subtotal: 1000,
            taxAmount: 180,
            depositAmount: 500,
            totalAmount: 1680,
            pickupDate: new Date(),
            returnDate: new Date(Date.now() + 86400000)
        }, {
            headers: { Authorization: `Bearer ${customerToken}` }
        });
        console.log('✅ Order Created:', orderRes.data.orderNumber);

        console.log('\n🎉 ALL TESTS PASSED!');

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
};

testAPI();
