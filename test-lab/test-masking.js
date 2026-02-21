const whylog = require('../dist/index');

whylog.init({ 
    mode: 'dev', 
    format: 'pretty', // Force format to visually see the output
    masking: {
        secrets: ['password', 'token', 'apiKey'],
        maskString: '*** HIDDEN ***'
    }
});

function testMasking() {
    console.log("Testing Context Data Masking...");
    
    // Create a mock Express request context
    const reqContext = {
        url: '/api/v1/auth/login',
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer super_secret_token_123'
        },
        body: {
            username: 'admin',
            password: 'my_secure_password',
            nested: {
                apiKey: 'sk_live_abc123456'
            }
        }
    };

    // Simulate an Express error utilizing the context object
    const error = new Error('Database connection completely dropped during login.');
    
    // We import report globally locally so we can test the internal reporter mapping
    const { report } = require('../dist/reporters/pretty');
    
    report(error, 'error', reqContext).then(() => {
        console.log("Masking test complete! Check if secrets are converted to *** HIDDEN ***");
    });
}

testMasking();
