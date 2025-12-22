// Visitor Tracker - Tracks active users on the website
(function() {
    'use strict';
    
    // Check if Firebase is initialized
    if (typeof db === 'undefined' || !db) {
        console.warn('Firebase not initialized. Visitor tracking disabled.');
        return;
    }
    
    // Generate unique visitor ID (stored in sessionStorage)
    let visitorId = sessionStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('visitorId', visitorId);
    }
    
    const visitorRef = db.collection('activeVisitors').doc(visitorId);
    const visitorsCollection = db.collection('activeVisitors');
    const SESSION_TIMEOUT = 60000; // 60 seconds - consider visitor inactive if no update
    
    // Track page visibility
    let isVisible = true;
    let heartbeatInterval;
    
    // Update visitor status
    function updateVisitorStatus() {
        if (!isVisible) return; // Don't update if tab is hidden
        
        const visitorData = {
            id: visitorId,
            lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            page: window.location.pathname,
            userAgent: navigator.userAgent.substring(0, 100), // Limit length
            screenWidth: window.screen.width,
            screenHeight: window.screen.height
        };
        
        visitorRef.set(visitorData, { merge: true }).catch(error => {
            console.error('Error updating visitor status:', error);
        });
    }
    
    // Initial update
    updateVisitorStatus();
    
    // Heartbeat - update every 30 seconds while page is visible
    heartbeatInterval = setInterval(() => {
        updateVisitorStatus();
    }, 30000);
    
    // Update on page visibility change
    document.addEventListener('visibilitychange', () => {
        isVisible = !document.hidden;
        if (isVisible) {
            updateVisitorStatus();
        }
    });
    
    // Update on user activity
    let activityTimeout;
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
        document.addEventListener(event, () => {
            clearTimeout(activityTimeout);
            activityTimeout = setTimeout(() => {
                if (isVisible) {
                    updateVisitorStatus();
                }
            }, 5000); // Update after 5 seconds of activity
        }, { passive: true });
    });
    
    // Clean up when page is unloaded
    window.addEventListener('beforeunload', () => {
        visitorRef.delete().catch(error => {
            console.error('Error removing visitor on unload:', error);
        });
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }
    });
    
    // Note: Cleanup of old visitors is handled in admin.js for better control
    
    console.log('Visitor tracking active. Visitor ID:', visitorId);
})();

