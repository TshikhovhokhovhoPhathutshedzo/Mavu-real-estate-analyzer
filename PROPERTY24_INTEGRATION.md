# Property24 Integration Status

The application does **not** currently connect to Property24. The `Property24API` object in `index.html` is a local simulator with hard-coded sample listings. The status badge correctly reads **Demo data only**; prices and comparables are illustrative, not verified market data.

## Current implementation

- Market assumptions are stored in `js/analyzer.js`.
- Example comparables are generated locally and are labeled as demo listings.
- Property images and the map image are illustrative, not tied to an analyzed address.
- No Property24 client package or API credentials are required to run the demo.

## Requirements for a real integration

Before adding live listings, confirm that an authorized Property24 API is available and review its terms. Implement requests through a server-side service, store credentials in server environment variables, and have the browser call that service. Never put API keys in `index.html`, JavaScript bundles, or browser storage.

Any production integration should distinguish verified live data from local estimates and preserve the application's valuation disclaimers.
