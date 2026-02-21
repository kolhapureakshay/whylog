const whylog = require('../dist/index');

whylog.init({
    mode: 'dev',
    format: 'pretty',
    breadcrumbs: { enabled: true, maxItems: 10 }
});

function runBreadcrumbCrash() {
    console.log("Testing Breadcrumbs (Action Timeline)...");
    
    // Simulating user journey
    whylog.addBreadcrumb("User navigated to /dashboard", "ui");
    whylog.addBreadcrumb("Component <ChartWidget> mounted successfully", "lifecycle");
    
    setTimeout(() => {
        whylog.addBreadcrumb("Initializing fetch to /api/metrics", "network");
        
        setTimeout(() => {
            whylog.addBreadcrumb("fetch() resolved with status 500", "network");
            
            // Crash now
            throw new Error("Failed to parse chart metrics from payload!");
        }, 100);
    }, 100);
}

runBreadcrumbCrash();
