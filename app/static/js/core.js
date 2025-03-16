// core.js - Shared functionality and initialization for the D&D Shop Generator

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle-checkbox');
    const htmlElement = document.documentElement;
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light-theme';
    htmlElement.className = savedTheme;
    
    // Set the toggle position based on theme
    themeToggle.checked = savedTheme === 'dark-theme';
    
    // Listen for toggle changes
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            htmlElement.className = 'dark-theme';
            localStorage.setItem('theme', 'dark-theme');
        } else {
            htmlElement.className = 'light-theme';
            localStorage.setItem('theme', 'light-theme');
        }
    });
});

// Track new service worker installation
let newWorker;
let refreshing = false;

// Check for service worker updates
function checkForUpdates() {
    // Register the service worker for update checks
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                // A new service worker is being installed
                newWorker = reg.installing;
                
                newWorker.addEventListener('statechange', () => {
                    // When the new service worker is installed, show the update toast
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        document.getElementById('update-toast').style.display = 'flex';
                    }
                });
            });
            
            // Listen for controller change to reload the page
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                window.location.reload();
                refreshing = true;
            });
        });
    }
}

// Update the app when the user clicks the update button
function updateApp() {
    document.getElementById('update-toast').style.display = 'none';
    if (newWorker) {
        // Send message to the new service worker to skip waiting
        newWorker.postMessage({ action: 'skipWaiting' });
    } else {
        window.location.reload();
    }
}

// Tab functionality
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";

    // Refresh items table when switching to Items tab
    if (tabName === 'Items' && typeof refreshItemsTable === 'function') {
        refreshItemsTable();
    }
    
    // Update category toggles when switching to Shop tab
    if (tabName === 'Shop' && typeof updateCategoryToggles === 'function') {
        updateCategoryToggles();
    }
}

// Reset application function
function resetApp() {
    if (confirm('Are you sure you want to reset all data? This cannot be undone!')) {
        localStorage.clear();
        if (typeof configStore !== 'undefined' && typeof configStore.resetToDefaults === 'function') {
            configStore.resetToDefaults();
        }
        if (typeof itemStore !== 'undefined' && typeof itemStore.saveItems === 'function') {
            itemStore.saveItems([]);
        }
        location.reload();
    }
}