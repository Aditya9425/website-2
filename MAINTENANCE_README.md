# Maintenance Mode System

## Overview
This system allows you to easily enable/disable maintenance mode for your website.

## Files Created
- `maintenance.html` - The maintenance page shown to users
- `maintenance-check.js` - Script that handles the maintenance mode logic
- `MAINTENANCE_README.md` - This documentation file

## How to Use

### Enable Maintenance Mode
1. Open `maintenance-check.js`
2. Change `const MAINTENANCE_MODE = false;` to `const MAINTENANCE_MODE = true;`
3. Save the file

### Disable Maintenance Mode
1. Open `maintenance-check.js`
2. Change `const MAINTENANCE_MODE = true;` to `const MAINTENANCE_MODE = false;`
3. Save the file

## How It Works
- When `MAINTENANCE_MODE = true`, all pages redirect to `maintenance.html`
- When `MAINTENANCE_MODE = false`, the website works normally
- The maintenance page itself is excluded from redirects to prevent infinite loops

## Features
- ✅ Full screen centered maintenance page
- ✅ Responsive design (mobile-friendly)
- ✅ Subtle animation (pulsing tool icon)
- ✅ Professional styling matching your brand colors
- ✅ Simple toggle mechanism
- ✅ Blocks access to all pages when enabled

## Customization
You can customize the maintenance page by editing `maintenance.html`:
- Change the message text
- Modify colors and styling
- Add your own animations or icons
- Update the gradient background

## Pages Protected
The maintenance check has been added to all main pages:
- index.html (Home)
- collections.html
- cart.html
- checkout.html
- auth.html
- contact.html
- profile.html

## Testing
1. Set `MAINTENANCE_MODE = true`
2. Visit any page of your website
3. You should be redirected to the maintenance page
4. Set `MAINTENANCE_MODE = false` to restore normal operation