# T.R.A.C.E.
## Takedown Request Automated Content Engine

T.R.A.C.E. is an automated system for generating professional and detailed takedown requests for phishing and fraudulent websites. The system is designed to provide accurate, context-aware descriptions of affected companies and their services.

### Features

- Automated generation of takedown request emails
- Support for 38+ business categories
- Context-aware company descriptions
- Multiple email templates based on recipient type
- Evidence-based risk assessment
- Detailed technical information formatting

### Supported Business Categories

1. Financial Services
   - Banks
   - Investment Platforms
   - Digital Wallets
   - Cryptocurrency Exchanges

2. Retail & Commerce
   - E-commerce Platforms
   - Retail Chains
   - Marketplaces
   - Classified Ads

3. Health & Wellness
   - Healthcare Services
   - Pharmacy Chains
   - Supplements Companies

4. Digital Services
   - Cloud Services
   - Digital Payments
   - Streaming Platforms
   - Social Networks

5. Travel & Transportation
   - Airlines
   - Travel Companies
   - Logistics Services

And many more...

### Usage

```typescript
const takedownText = generateTakedownText({
  domain: "suspicious-site.com",
  ip: "192.0.2.1",
  detected_brand: {
    name: "Example Brand",
    category: "E-commerce"
  },
  // ... additional parameters
});
```

### Project Structure

```
src/
├── generators/
│   ├── takedown.ts        # Main takedown text generator
│   └── templates/         # Email templates
├── types/
│   └── index.ts          # Type definitions
└── utils/
    └── categories.ts     # Business categories and descriptions
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### License

This project is licensed under the MIT License - see the LICENSE file for details.
