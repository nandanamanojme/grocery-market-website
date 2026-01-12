
// ======================================
// Simple dataLayer for future analytics
// No GA4/GTM/Adobe libraries included now.
// ======================================

window.dataLayer = window.dataLayer || [];

// Optional debug: add ?dl_debug=1 to URL to print pushes
const DL_DEBUG = new URLSearchParams(window.location.search).get('dl_debug') === '1';

// Keep original push
const __origPush = window.dataLayer.push.bind(window.dataLayer);

window.dataLayer.push = function(obj){
  if(DL_DEBUG){
    console.group('%cdataLayer.push', 'color:#2e7d32;font-weight:bold;');
    console.log(obj);
    console.groupEnd();
  }
  return __origPush(obj);
};

// Helper to push structured events consistently
function dataLayerPush(eventName, params={}){
  window.dataLayer.push({
    event: eventName,
    page: document.body.getAttribute('data-page') || '',
    timestamp: new Date().toISOString(),
    ...params
  });
}
