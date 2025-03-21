export interface BrandInfo {
  name: string;
  category?: string;
  official_url?: string;
}

export interface WhoisInfo {
  creation_date: string;
  registrar?: string;
}

export interface IpInfo {
  company?: {
    name: string;
  };
}

export interface TakedownData {
  domain: string;
  ip?: string;
  detected_brand?: BrandInfo;
  brand_category?: string;
  phishing_indicators?: string[];
  whois_info?: WhoisInfo;
  ip_info?: IpInfo;
} 