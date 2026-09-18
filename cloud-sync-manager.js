/**
 * cloud-sync-manager.js
 * In-App Safe Cloud Synchronizer
 */

async function syncCloudData(endpointUrl, onSuccess, onError) {
    const syncBadge = document.getElementById('syncStatus'); // Update with your UI element ID
    if (syncBadge) syncBadge.innerText = 'Syncing Cloud...';

    // Set a 5-second timeout controller so in-app browsers don't hang infinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(endpointUrl, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();

        // Update UI status to completed
        if (syncBadge) syncBadge.innerText = 'Cloud Synced';
        if (typeof onSuccess === 'function') onSuccess(data);

    } catch (error) {
        clearTimeout(timeoutId);
        console.warn('Sync failed or timed out in in-app browser. Falling back to local state:', error);

        // Fail gracefully so the user isn't stuck on "Syncing Cloud..."
        if (syncBadge) syncBadge.innerText = 'Offline Mode';
        
        // Execute fallback UI or load cached flipbook/book data
        if (typeof onError === 'function') {
            onError(error);
        }
    }
}

// Example usage:
// syncCloudData('/api/get-books', (data) => renderBooks(data), (err) => loadCachedBooks());
