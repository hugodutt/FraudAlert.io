import { TakedownData } from '../types';
import { getCompanyDescription, getSectorContext } from '../utils/categories';

export function generateTakedownText(data: TakedownData): string {
  const brand = data.detected_brand?.name || 'Unknown Brand';
  const context = getSectorContext(data.brand_category || 'Unknown Category');
  const indicators = data.phishing_indicators || [];
  
  // Determine urgency based on multiple factors
  let urgencyLevel = context.urgency;
  if (indicators.length > 5 || data.brand_category === 'Financial Services') {
    urgencyLevel = 'CRITICAL';
  }

  // Build evidence-based risk description
  const risks = [];
  if (indicators.some(i => i.includes('login') || i.includes('senha'))) {
    risks.push('credential theft attempt');
  }
  if (indicators.some(i => i.includes('marca') || i.includes('logo'))) {
    risks.push('brand impersonation');
  }
  if (indicators.some(i => i.includes('payment') || i.includes('cartão'))) {
    risks.push('payment data collection');
  }

  // Determine template type based on host info
  const isHostingProvider = data.ip_info?.company?.name?.toLowerCase().includes('hosting') || false;
  const isCloudProvider = data.ip_info?.company?.name?.toLowerCase().match(/(aws|azure|google|cloud)/i) !== null;
  
  // Build the base information block
  const baseInfo = `Domain: ${data.domain}
IP Address: ${data.ip || 'N/A'}`;

  // Get company description
  const companyDescription = getCompanyDescription(brand, data.brand_category || '');

  // Build the evidence block
  const evidenceBlock = `${risks.length > 0 ? `\nThis fraudulent website has been confirmed to engage in ${risks.join(', ')}.` : ''}${indicators.length > 3 ? `\n\nOur analysis identified multiple high-risk indicators including suspicious authentication forms and unauthorized brand assets.` : ''}${data.whois_info && data.whois_info.creation_date !== 'N/A' ? `\nThe domain's recent registration (${data.whois_info.creation_date}) suggests this is part of an active phishing campaign.` : ''}`;

  // Technical template for hosting/cloud providers
  if (isHostingProvider || isCloudProvider) {
    return `Subject: [${urgencyLevel}] Phishing Site Takedown Request - ${data.domain}

Dear Abuse Team,

We detected a phishing website hosted at:

${baseInfo}

This fake website was created to attack ${companyDescription}. The organization's legitimate website is: ${data.detected_brand?.official_url || '[Official URL]'}.

${evidenceBlock}

Besides that, we have found issues where the page is activated and deactivated by the fraudster according to their configuration, so even though it may seem inaccessible, the phishing page can be reactivated at any time.

That is why we request your action to help us deactivate the content available not only on the reported URL, but also in the whole server related to the domain.

We kindly ask your cooperation, according to your policies, to cease this activity and shut down the phishing page as soon as possible.

Thanks in advance. We would also appreciate it if you could provide a confirmation that this message has been received and an estimate of the time to shutdown.

Best regards,
Anti-Phishing Team`;
  }
  
  // General template for other providers
  return `Subject: [${urgencyLevel}] Phishing Site Takedown Request - ${data.domain}

Dear Sir/Madam,

We detected a scam website hosted at your network:

${baseInfo}

This fake website was created to attack ${companyDescription}. The organization's legitimate website is: ${data.detected_brand?.official_url || '[Official URL]'}.

${evidenceBlock}

We kindly ask your cooperation, according to your policies, to cease this activity and shut down the malicious/fake page as soon as possible. While this malicious page remains available, more users can be victims of fraud.

Thank you in advance for your support. We look forward to your response. Have a great day!

Best regards,
Anti-Phishing Team`;
} 