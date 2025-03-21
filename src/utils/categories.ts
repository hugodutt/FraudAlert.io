import { BrandInfo } from '../types';

interface SectorContext {
  urgency: string;
  risk_level: string;
}

export function getSectorContext(category: string): SectorContext {
  switch (category) {
    case 'Financial Services':
    case 'Banking':
    case 'Digital Payments':
    case 'Cryptocurrency':
      return { urgency: 'CRITICAL', risk_level: 'HIGH' };
    case 'Healthcare':
    case 'Insurance':
    case 'Government Services':
      return { urgency: 'HIGH', risk_level: 'HIGH' };
    default:
      return { urgency: 'MEDIUM', risk_level: 'MEDIUM' };
  }
}

export function getCompanyDescription(brand: string, category: string): string {
  switch (category) {
    case 'Supplements':
      return `${brand}, one of Brazil's leading sports nutrition and supplement companies`;
    case 'Retail':
      return `${brand}, one of the largest retail chains in Brazil`;
    case 'Financial Services':
      return `${brand}, a major Brazilian financial institution`;
    case 'E-commerce':
      return `${brand}, a prominent Brazilian e-commerce platform`;
    case 'Insurance':
      return `${brand}, a leading insurance company in Brazil`;
    case 'Fintech':
      return `${brand}, an innovative Brazilian digital financial services company`;
    case 'Beauty & Cosmetics':
      return `${brand}, a renowned Brazilian beauty and cosmetics company`;
    case 'Fashion':
      return `${brand}, a major Brazilian fashion retailer`;
    case 'Pharmacy':
      return `${brand}, one of Brazil's largest pharmacy retail chains`;
    case 'Airlines':
      return `${brand}, a major Brazilian airline company`;
    case 'Telecom':
      return `${brand}, a leading telecommunications provider in Brazil`;
    case 'Streaming':
      return `${brand}, a popular streaming service provider`;
    case 'Food Delivery':
      return `${brand}, a major food delivery platform in Brazil`;
    case 'Education':
      return `${brand}, a prominent Brazilian educational institution`;
    case 'Gaming':
      return `${brand}, a major gaming and entertainment platform`;
    case 'Automotive':
      return `${brand}, a leading automotive marketplace in Brazil`;
    case 'Real Estate':
      return `${brand}, a prominent real estate platform in Brazil`;
    case 'Travel':
      return `${brand}, a major travel and hospitality company`;
    case 'Digital Payments':
      return `${brand}, a leading digital payment solutions provider in Brazil`;
    case 'Cryptocurrency':
      return `${brand}, a prominent cryptocurrency exchange platform in Brazil`;
    case 'Government Services':
      return `${brand}, an essential Brazilian government service platform`;
    case 'Healthcare':
      return `${brand}, a major healthcare services provider in Brazil`;
    case 'Sports Betting':
      return `${brand}, a regulated sports betting platform in Brazil`;
    case 'Logistics':
      return `${brand}, a leading logistics and delivery services company in Brazil`;
    case 'Job Portals':
      return `${brand}, one of Brazil's largest employment and recruitment platforms`;
    case 'Cloud Services':
      return `${brand}, a major cloud computing and services provider`;
    case 'Social Networks':
      return `${brand}, a popular social networking platform`;
    case 'Entertainment':
      return `${brand}, a major entertainment and media company in Brazil`;
    case 'Marketplaces':
      return `${brand}, a leading peer-to-peer marketplace platform in Brazil`;
    case 'Investment Platforms':
      return `${brand}, a prominent investment and trading platform in Brazil`;
    case 'Utilities':
      return `${brand}, an essential utility services provider in Brazil`;
    case 'Dating Apps':
      return `${brand}, a popular online dating platform in Brazil`;
    case 'NFT & Digital Art':
      return `${brand}, a leading NFT and digital art marketplace`;
    case 'Loyalty Programs':
      return `${brand}, a major customer loyalty and rewards program in Brazil`;
    case 'Digital Wallets':
      return `${brand}, a prominent digital wallet and payment services provider in Brazil`;
    case 'Classified Ads':
      return `${brand}, one of Brazil's largest classified advertisements platforms`;
    case 'News & Media':
      return `${brand}, a major Brazilian news and media organization`;
    case 'Professional Services':
      return `${brand}, a leading professional services platform in Brazil`;
    default:
      return brand;
  }
} 