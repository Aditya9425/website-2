// Maintenance mode toggle - set to true to enable maintenance mode
const MAINTENANCE_MODE = true;

// Check maintenance mode and redirect if needed
if (MAINTENANCE_MODE && !window.location.pathname.includes('maintenance.html')) {
    window.location.href = 'maintenance.html';
}