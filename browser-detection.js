// Browser Detection Script for ORLO
// Add this script to the very beginning of your app.js file, or in a <script> tag in your HTML <head>

(function() {
    // Detect browser and add class to body
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent) && !/opr/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isEdge = /edg/.test(userAgent);
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addBrowserClass);
    } else {
        addBrowserClass();
    }
    
    function addBrowserClass() {
        if (isChrome) {
            document.body.classList.add('chrome');
            console.log('Browser detected: Chrome');
        } else if (isSafari) {
            document.body.classList.add('safari');
            console.log('Browser detected: Safari');
        } else if (isEdge) {
            document.body.classList.add('edge');
            console.log('Browser detected: Edge');
        }
    }
})();
