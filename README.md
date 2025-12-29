# Redirect Verification Tool

A React-based web application for testing and verifying URL redirects. This tool helps you validate that old URLs properly redirect to their expected new destinations, making it ideal for website migrations, URL restructuring, and redirect audits.

## Features

- **Bulk Redirect Testing**: Paste multiple URL pairs and test them all at once
- **Flexible Input Formats**: Supports CSV, tab-separated, or arrow-separated formats
- **Domain Configuration**: Set old and new base domains for easy path-based testing
- **Real-time Progress**: Watch as each redirect is tested with live status updates
- **Visual Status Indicators**: Clear badges showing success, mismatch, or manual check needed
- **CSV Export**: Download results for further analysis or reporting
- **CORS Handling**: Gracefully handles browser security limitations with manual verification options

## Prerequisites

- **Node.js**: Version 20.19+ or 22.12+ (required by Vite)
- **npm**: Comes with Node.js

## Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Build for Production

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Usage

1. **Configure Domains** (optional):
   - Enter the old site domain (source) if testing a migration
   - Enter the new site domain (target) if different from the old domain
   - If testing redirects on the same domain, you can leave these blank and use full URLs

2. **Paste Redirects**:
   - Format: `old-url, new-url` or `old-url [tab] new-url` or `old-url -> new-url`
   - You can use full URLs or paths (paths will be combined with the base domains)
   - Example:
     ```
     /old-page, /new-page
     /blog/post-1, /articles/post-1
     https://oldsite.com/about -> https://newsite.com/about-us
     ```

3. **Run Check**:
   - Click "Run Check" to test all redirects
   - Watch the progress as each URL is tested
   - Review results in the table

4. **Review Results**:
   - **Success** (green): Redirect works correctly
   - **Mismatch** (yellow): Redirects but to a different URL than expected
   - **Manual Check** (gray): CORS/network error - click "Verify" to test manually

5. **Export Results**:
   - Click "Export CSV" to download a detailed report of all test results

## Tech Stack

- **React 19**: UI framework
- **Vite 7**: Build tool and dev server
- **Tailwind CSS v4**: Utility-first CSS framework
- **Lucide React**: Icon library

## Browser Limitations

Due to browser CORS (Cross-Origin Resource Sharing) security policies, some redirects may not be testable programmatically. These will be marked as "Manual Check" with a verification link to test them manually in a new tab.

## License

MIT