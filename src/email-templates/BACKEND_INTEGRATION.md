# Backend Integration Guide: Email Templates

To use these templates in your backend (e.g., Node.js with Nodemailer, Python with SendGrid, etc.), follow these steps:

## 1. File Locations
Templates are located in: `src/email-templates/`
- [welcome.html](file:///d:/WatchCash/Watchcash-admin/src/email-templates/welcome.html)
- [reset-password.html](file:///d:/WatchCash/Watchcash-admin/src/email-templates/reset-password.html)

## 2. Dynamic Placeholders
The templates use `{{variable}}` syntax for easy replacement:

### Welcome Email (`welcome.html`)
- `{{name}}`: User's display name.
- `{{login_url}}`: URL to the login page.
- `{{unsubscribe_url}}`: URL to manage email preferences.

### Reset Password Email (`reset-password.html`)
- `{{name}}`: User's display name.
- `{{reset_url}}`: Secure password reset link.
- `{{expiry_time}}`: Link expiration duration (e.g., "2").

## 3. Best Practices for Sending
- **Inline CSS**: While already included, ensure your email sender doesn't strip these styles.
- **Multipart Emails**: Always send both an HTML version and a Plain Text version for maximum deliverability.
- **SPF/DKIM/DMARC**: Ensure these DNS records are set up on your sending domain to prevent emails from going to spam.
- **Image Hosting**: Replace the placeholder logo or text with absolute URLs to hosted images (e.g., `https://cdn.watchcash.com/logo.png`).

## 4. Example (Node.js/Handelbars)
```javascript
const fs = require('fs');
const handlebars = require('handlebars');

const source = fs.readFileSync('path/to/welcome.html', 'utf-8');
const template = handlebars.compile(source);
const html = template({ name: 'John Doe', login_url: 'https://admin.watchcash.com' });
```
