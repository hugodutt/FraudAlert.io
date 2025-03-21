// Manter a lista existente de marcas conhecidas
const knownBrands = [
  // Suplementos e Nutrição Esportiva
  'growth supplements', 'growth', 'growthsuplementos', 'max titanium', 'maxtitanium',
  'integral medica', 'integralmedica', 'black skull', 'blackskull', 'darkness',
  'probiotica', 'athletica', 'optimum nutrition', 'dymatize', 'universal',
  'muscletech', 'bpi sports', 'gaspari', 'bsn', 'nutrata',
  
  // Varejo e Supermercados
  'atacadao', 'atacadão', 'carrefour', 'assai', 'assaí', 'makro', 'sams club', 
  'fort atacadista', 'tenda atacado', 'maxxi atacado', 'villefort',
  
  // E-commerce e Marketplaces
  'netshoes', 'amazon', 'mercado livre', 'americanas', 'magalu', 'magazine luiza',
  'shopee', 'aliexpress', 'shein', 'casas bahia', 'submarino', 'centauro', 'dafiti',
  
  // Esportes
  'nike', 'adidas', 'puma', 'under armour', 'reebok', 'mizuno', 'asics', 
  'new balance', 'olympikus', 'fila', 'decathlon',
  
  // Bancos e Fintech
  'nubank', 'itau', 'bradesco', 'santander', 'banco do brasil', 'caixa',
  'inter', 'c6', 'next', 'picpay', 'will bank',
  
  // Beleza e Cuidados Pessoais
  'natura', 'boticario', 'o boticario', 'avon', 'mary kay', 'mac cosmetics',
  'clinique', 'lancome', 'la roche posay', 'vichy', 'cerave', 'simple organic',
  'vult', 'ruby rose', 'mari maria', 'quem disse berenice'
];

import { NextResponse } from 'next/server';
import { extractDomain } from '@/utils/url';
import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function detectBrandFromDomain(domain: string, htmlContent: string = '', potentialBrands: string[] = []): Promise<{ 
  name: string; 
  confidence: number;
  category: string;
} | null> {
  try {
    const prompt = `Analyze this domain and HTML content to identify which brand is being targeted by this potential phishing site.

Domain: ${domain}
HTML Content:
Title: ${htmlContent}
Full Content Preview (first 2000 chars): ${htmlContent.slice(0, 2000)}
Potential Brands Found: ${potentialBrands.join(', ')}

IMPORTANT BRAND DETECTION RULES:
1. Domain Analysis:
   - Look for brand parts in domain (e.g., "atca" = "Atacadão")
   - Check common variations:
     * With/without accents (atacadao/atacadão)
     * Abbreviated forms (atca/atacad)
     * Common misspellings
   - Examples:
     * atca -> Atacadão
     * renovabe -> Renova Be
     * bbr -> Banco do Brasil
     * growth -> Growth Supplements

2. Content Analysis:
   - Look for brand mentions in:
     * Page title and headers
     * Image names and alt text
     * Product descriptions
     * Copyright notices
     * Contact information
     * Company legal information (CNPJ, Razão Social)
     * Customer service email domains
   - Consider partial matches and variations
   - Check for sector-specific terms

3. Brand Knowledge Base:
   A. Suplementos e Nutrição Esportiva:
   - Premium Nacional:
     * Growth Supplements (growth, growthsuplementos)
     * Max Titanium (maxtitanium, max)
     * Integral Médica (integralmedica)
     * BlackSkull (blackskull, bskull)
   - Premium Internacional:
     * Optimum Nutrition (on, optimum)
     * Dymatize (dymatize, elite)
   - Intermediárias:
     * Probiótica (probiotica)
     * Athletica (athletica)
     * Darkness
   
   B. Cosméticos e Beleza:
   - Premium Internacional: La Roche, Vichy, Clinique, MAC
   - Premium Nacional: Natura, O Boticário
   - Entrada: Vult, Ruby Rose, Mari Maria

   C. Varejo e Supermercados:
   - Atacadistas: Atacadão, Assaí, Makro
   - Hipermercados: Carrefour, Extra, Big
   - Supermercados: Pão de Açúcar, Dia

4. Sector-Specific Indicators:
   A. Suplementos:
   - Produtos: Whey Protein, Creatina, BCAA, Pré-treino
   - Termos: Suplementos, Nutrition, Supplements
   - Certificações: ANVISA, GMP, FDA
   - Emails: sac@marca.com.br, vendas@marca.com.br

   B. Cosméticos:
   - Produtos: Perfumes, Maquiagem, Cremes
   - Termos: Beleza, Beauty, Cosméticos
   - Certificações: ANVISA, Cruelty-free
   
   C. Varejo:
   - Produtos: Alimentos, Bebidas, Limpeza
   - Termos: Atacado, Varejo, Mercado
   - Certificações: ABRAS, Procon

5. Brand Confidence Scoring:
   - 0.9+ : Multiple strong indicators (company info, products, domain)
   - 0.8+ : Strong sector alignment with brand mentions
   - 0.7+ : Clear brand reference with some variations
   - 0.6+ : Partial match with sector alignment
   - 0.5+ : Weak but identifiable brand signals

CRITICAL: For this analysis, pay special attention to:
1. Company legal information and customer service emails
2. Sector-specific product catalogs
3. Brand variations and abbreviations
4. Context from product categories and descriptions

Based on these rules, analyze the provided information and respond in this JSON format:
{
  "brand": "string (use the official brand name, NEVER 'Unknown')",
  "confidence": number (0.0 to 1.0),
  "reasoning": "string (detailed explanation)",
  "category": "string (sector category)",
  "indicators": ["list of specific indicators found"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a phishing detection expert specialized in identifying targeted brands from website content and URLs. You must identify brands even from partial matches or variations. For example, 'atca' strongly indicates 'Atacadão', 'bbr' indicates 'Banco do Brasil', 'growth' indicates 'Growth Supplements'. Always look for these patterns and variations, especially in Brazilian retail and supplement sectors. Never return 'Unknown' if there are any brand indicators present."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content || '{"brand": null, "confidence": 0, "reasoning": "", "category": "", "indicators": []}';
    const result = JSON.parse(content);
    
    if (!result.brand || result.confidence < 0.5) {
      console.log('Análise de marca:', result.reasoning);
      console.log('Indicadores encontrados:', result.indicators);
      return null;
    }
    
    console.log(`Marca detectada: ${result.brand} (${result.category}) - Confiança: ${result.confidence}`);
    console.log('Razão:', result.reasoning);
    console.log('Indicadores:', result.indicators);
    
    return {
      name: result.brand,
      confidence: result.confidence,
      category: result.category
    };
  } catch (error) {
    console.error('Erro ao detectar marca:', error);
    return null;
  }
}

async function analyzeHtmlContent(url: string): Promise<{
  title: string;
  description: string;
  keywords: string[];
  forms: boolean;
  loginFields: boolean;
  brandImages: boolean;
  securityIcons: boolean;
  fullContent: string;
  potentialBrands: string[];
}> {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      },
      validateStatus: (status) => status < 400
    });
    
    if (typeof response.data !== 'string') {
      throw new Error('Expected HTML string but got different response type');
    }
    
    const html = response.data;
    
    // Análise básica do HTML
    const hasLoginForm = /type=["']password["']/i.test(html) || /login/i.test(html);
    const hasBrandImages = /logo|brand|marca/i.test(html);
    const hasSecurityIcons = /security|secure|ssl|lock/i.test(html);
    const hasForms = /<form/i.test(html);
    
    // Extrair meta tags e conteúdo relevante
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
    const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [];

    // Extrair texto relevante do HTML
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Buscar por padrões específicos que podem indicar marcas
    const potentialBrands: string[] = [];
    
    // Função auxiliar para contar ocorrências de uma palavra
    function countOccurrences(text: string, word: string): number {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return (text.match(regex) || []).length;
    }

    // Função para limpar e extrair potencial marca do domínio
    function cleanDomainForBrandAnalysis(domain: string): string[] {
      // Remover www. e extensões comuns
      const cleanDomain = domain
        .replace(/^www\./i, '')
        .replace(/\.(com|net|org|io|br|shop|store|app|site|online|top)$/i, '');
      
      // Separar por hífen, ponto ou números
      const parts = cleanDomain.split(/[-_.\d]/);
      
      // Filtrar partes muito curtas ou palavras comuns
      const commonPrefixes = ['my', 'the', 'loja', 'shop', 'store', 'app', 'site', 'br'];
      return parts
        .filter(part => part.length > 2)
        .filter(part => !commonPrefixes.includes(part.toLowerCase()))
        .map(part => {
          // Verificar se a parte contém uma marca conhecida
          const lowerPart = part.toLowerCase();
          const matchingBrand = knownBrands.find(brand => 
            lowerPart.includes(brand.toLowerCase().replace(/[áãâàäç]/g, a => 
              a.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            ))
          );
          return matchingBrand || part;
        });
    }

    // Função para pontuar potenciais marcas
    function scorePotentialBrand(brand: string, html: string, domain: string): number {
      let score = 0;
      const lowerBrand = brand.toLowerCase();
      const normalizedBrand = lowerBrand.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Pontuação por menções em elementos críticos
      const criticalElements = [
        // Copyright e informações legais
        new RegExp(`copyright.*${normalizedBrand}.*ltda`, 'i'),
        new RegExp(`${normalizedBrand}.*produtos.*ltda`, 'i'),
        new RegExp(`cnpj.*${normalizedBrand}`, 'i'),
        
        // Email corporativo
        new RegExp(`@${normalizedBrand.replace(/\s+/g, '')}`, 'i'),
        new RegExp(`sac@${normalizedBrand.replace(/\s+/g, '')}`, 'i'),
        
        // Nome completo da empresa
        new RegExp(`${normalizedBrand}.*supplements`, 'i'),
        new RegExp(`${normalizedBrand}.*suplementos`, 'i'),
      ];

      criticalElements.forEach(regex => {
        if (regex.test(html)) {
          score += 25; // Peso muito alto para informações corporativas
        }
      });

      type SectorProducts = {
        [key: string]: string[];
      };

      // Pontuação por produtos específicos do setor
      const sectorProducts: SectorProducts = {
        'suplementos': [
          'whey protein', 'creatina', 'pré-treino', 'bcaa', 'glutamina',
          'multivitamínico', 'termogênico', 'proteína', 'massa', 'weight'
        ],
        'cosmeticos': [
          'perfume', 'maquiagem', 'batom', 'shampoo', 'hidratante',
          'creme', 'protetor solar', 'desodorante', 'sabonete'
        ],
        'farmacia': [
          'medicamento', 'remédio', 'vitamina', 'suplemento', 'comprimido',
          'cápsula', 'pomada', 'xarope', 'spray'
        ]
      };

      // Contar produtos específicos do setor
      let sectorMatches = 0;
      let dominantSector = '';
      for (const [sector, products] of Object.entries(sectorProducts)) {
        const sectorCount = products.filter(product => 
          html.toLowerCase().includes(product)
        ).length;
        
        if (sectorCount > sectorMatches) {
          sectorMatches = sectorCount;
          dominantSector = sector;
        }
      }

      // Adicionar pontuação baseada no setor dominante
      score += sectorMatches * 5;

      // Verificar se a marca corresponde ao setor dominante
      if (dominantSector === 'suplementos' && 
          (lowerBrand.includes('suplementos') || lowerBrand.includes('nutrition') || 
           lowerBrand.includes('growth') || lowerBrand.includes('max'))) {
        score += 15;
      } else if (dominantSector === 'cosmeticos' && 
                (lowerBrand.includes('cosmet') || lowerBrand.includes('beauty') || 
                 lowerBrand.includes('natura') || lowerBrand.includes('boticario'))) {
        score += 15;
      }

      // Pontuação por elementos de e-commerce específicos do setor
      const sectorElements: SectorProducts = {
        'suplementos': ['whey', 'protein', 'creatina', 'treino', 'academia', 'fitness'],
        'cosmeticos': ['beleza', 'makeup', 'cosmet', 'perfum', 'dermocosmet'],
        'farmacia': ['farma', 'medicament', 'saude', 'drogaria', 'manipul']
      };

      if (dominantSector in sectorElements) {
        const sectorTerms = sectorElements[dominantSector];
        const termMatches = sectorTerms.filter((term: string) => 
          html.toLowerCase().includes(term)
        ).length;
        score += termMatches * 3;
      }

      // Pontuação baseada em ocorrências no texto
      const occurrences = countOccurrences(html, brand) + 
                         countOccurrences(html, normalizedBrand);
      score += occurrences * 2;
      
      // Pontuação por posição em títulos de produtos
      const productTitles = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
      let titleStartCount = 0;
      
      productTitles.forEach(title => {
        const cleanTitle = title.replace(/<[^>]+>/g, '').trim().toLowerCase();
        const normalizedTitle = cleanTitle.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        if (cleanTitle.startsWith(lowerBrand) || normalizedTitle.startsWith(normalizedBrand)) {
          score += 5;
          titleStartCount++;
        }
        if (cleanTitle.includes(lowerBrand) || normalizedTitle.includes(normalizedBrand)) {
          score += 2;
        }
      });
      
      // Bônus extra se aparecer no início de vários títulos
      if (titleStartCount >= 3) score += 15;
      
      // Pontuação por presença no domínio (após limpeza)
      const domainParts = cleanDomainForBrandAnalysis(domain);
      if (domainParts.some(part => 
        part.toLowerCase().includes(normalizedBrand) || 
        part.toLowerCase().includes(lowerBrand)
      )) {
        score += 10;
      }
      
      // Pontuação por presença em elementos importantes
      const brandVariations = [
        lowerBrand,
        normalizedBrand,
        lowerBrand.replace(/[aeiou]/g, ''),
        normalizedBrand.replace(/[aeiou]/g, '')
      ];
      
      brandVariations.forEach(variation => {
        if (html.toLowerCase().includes(`logo-${variation}`)) score += 3;
        if (html.toLowerCase().includes(`${variation}-logo`)) score += 3;
        if (html.toLowerCase().includes(`marca-${variation}`)) score += 3;
        if (html.toLowerCase().includes(`${variation}-oficial`)) score += 5;
        if (html.toLowerCase().includes(`oficial-${variation}`)) score += 5;
      });
      
      // Bônus para marcas conhecidas
      if (knownBrands.some(kb => 
        kb.toLowerCase() === lowerBrand || 
        kb.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedBrand
      )) {
        score += 10;
      }
      
      return score;
    }

    // Função para analisar repetições consistentes
    function analyzeConsistentPatterns(text: string, domain: string): string[] {
      const words = text.split(/\s+/);
      const wordCounts = new Map<string, number>();
      const domainParts = cleanDomainForBrandAnalysis(domain);
      
      // Contar ocorrências de cada palavra
      words.forEach(word => {
        word = word.replace(/[^a-zA-Z0-9]/g, '');
        if (word.length > 2) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
      });

      // Filtrar e pontuar palavras
      return Array.from(wordCounts.entries())
        .filter(([word, count]) => {
          const isDomainWord = domainParts.some(part => 
            part.toLowerCase() === word.toLowerCase()
          );
          return (count >= 3 && word.length > 3) || (count >= 2 && isDomainWord);
        })
        .map(([word]) => word);
    }

    // Função para extrair palavras que aparecem em posição de marca
    function extractBrandPositionWords(html: string): string[] {
      const brandWords: string[] = [];
      
      // Buscar em títulos de produtos
      const productTitles = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
      productTitles.forEach(title => {
        const words = title.replace(/<[^>]+>/g, '').trim().split(/\s+/);
        if (words.length > 0) {
          // Primeira palavra do título frequentemente é a marca
          const firstWord = words[0].replace(/[^a-zA-Z0-9]/g, '');
          if (firstWord.length > 2) {
            brandWords.push(firstWord);
          }
        }
      });

      return brandWords;
    }

    // Função para detectar padrões de nomenclatura de produtos
    function detectProductNamingPatterns(html: string): string[] {
      const patterns: string[] = [];
      const productTitles = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
      
      // Mapa para contar prefixos comuns
      const prefixCount = new Map<string, number>();
      
      productTitles.forEach(title => {
        const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
        // Procurar por padrões como "Marca Produto" ou "Marca - Produto"
        const parts = cleanTitle.split(/[\s-]+/);
        if (parts.length > 1) {
          const potentialBrand = parts[0].replace(/[^a-zA-Z0-9]/g, '');
          if (potentialBrand.length > 2) {
            prefixCount.set(potentialBrand, (prefixCount.get(potentialBrand) || 0) + 1);
          }
        }
      });

      // Se um prefixo aparece em múltiplos títulos, provavelmente é a marca
      patterns.push(...Array.from(prefixCount.entries())
        .filter(([_, count]) => count >= 2)
        .map(([prefix]) => prefix));

      return patterns;
    }

    // Buscar por padrões de nome/marca
    const namePatterns = [
      /name:\s*["']([^"']+)["']/gi,
      /name=["']([^"']+)["']/gi,
      /brand:\s*["']([^"']+)["']/gi,
      /brand=["']([^"']+)["']/gi,
      /marca:\s*["']([^"']+)["']/gi,
      /marca=["']([^"']+)["']/gi,
      /store:\s*["']([^"']+)["']/gi,
      /store=["']([^"']+)["']/gi,
      /loja:\s*["']([^"']+)["']/gi,
      /loja=["']([^"']+)["']/gi
    ];

    // Adicionar busca em títulos (h1, h2, h3)
    const headingMatches = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
    if (headingMatches) {
      headingMatches.forEach(match => {
        const headingText = match.replace(/<[^>]+>/g, '').trim();
        // Extrair nomes de marcas conhecidas dos títulos
        knownBrands.forEach(brand => {
          if (headingText.toLowerCase().includes(brand.toLowerCase())) {
            potentialBrands.push(brand);
          }
        });
      });
    }

    // Adicionar busca em imagens (src e alt)
    const imageMatches = html.match(/<img[^>]+>/gi);
    if (imageMatches) {
      imageMatches.forEach(match => {
        // Buscar no src da imagem
        const srcMatch = match.match(/src=["']([^"']+)["']/i);
        if (srcMatch) {
          const srcPath = srcMatch[1].toLowerCase();
          knownBrands.forEach(brand => {
            if (srcPath.includes(brand.toLowerCase().replace(/\s+/g, '-')) ||
                srcPath.includes(brand.toLowerCase().replace(/\s+/g, '_')) ||
                srcPath.includes(brand.toLowerCase().replace(/\s+/g, ''))) {
              potentialBrands.push(brand);
            }
          });
        }

        // Buscar no alt da imagem
        const altMatch = match.match(/alt=["']([^"']+)["']/i);
        if (altMatch) {
          const altText = altMatch[1].toLowerCase();
          knownBrands.forEach(brand => {
            if (altText.includes(brand.toLowerCase())) {
              potentialBrands.push(brand);
            }
          });
        }
      });
    }

    // Aplicar as novas análises inteligentes
    const domainName = url.replace(/^https?:\/\//, '').split('/')[0];
    const brandPositionWords = extractBrandPositionWords(html);
    const consistentPatterns = analyzeConsistentPatterns(textContent, domainName);
    const productPatterns = detectProductNamingPatterns(html);

    // Adicionar resultados das novas análises
    potentialBrands.push(...brandPositionWords);
    potentialBrands.push(...consistentPatterns);
    potentialBrands.push(...productPatterns);

    // Buscar por padrões de nome/marca no HTML (mantido do código original)
    for (const pattern of namePatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !potentialBrands.includes(match[1])) {
          potentialBrands.push(match[1]);
        }
      }
    }

    // Buscar por marcas conhecidas no texto completo (mantido do código original)
    for (const brand of knownBrands) {
      const regex = new RegExp(brand, 'gi');
      if (regex.test(textContent) && !potentialBrands.includes(brand)) {
        potentialBrands.push(brand);
      }
    }

    // Buscar em classes e IDs (mantido do código original)
    const classAndIdPattern = /(?:class|id)=["']([^"']*(?:brand|store|shop|marca|loja|logo)[^"']*)["']/gi;
    const classAndIdMatches = html.matchAll(classAndIdPattern);
    for (const match of classAndIdMatches) {
      if (match[1]) {
        const words = match[1].split(/[-_\s]/);
        for (const word of words) {
          if (word.length > 3 && !potentialBrands.includes(word)) {
            potentialBrands.push(word);
          }
        }
      }
    }

    // Remover duplicatas e filtrar marcas muito curtas
    const uniqueBrands = [...new Set(potentialBrands)]
      .filter(brand => {
        // Filtrar marcas muito curtas ou que são apenas o domínio completo
        if (brand.length <= 3) return false;
        if (brand.toLowerCase() === url.toLowerCase()) return false;
        if (brand.toLowerCase() === domainName.toLowerCase()) return false;
        
        // Filtrar palavras comuns que não são marcas
        const commonWords = ['shop', 'store', 'loja', 'site', 'app', 'online', 'oficial', 'original'];
        if (commonWords.includes(brand.toLowerCase())) return false;
        
        // Manter palavras que aparecem frequentemente em títulos de produtos
        const score = scorePotentialBrand(brand, html, domainName);
        return score >= 10; // Exigir pontuação mínima para ser considerada marca
      })
      .sort((a, b) => {
        // Ordenar por pontuação
        const scoreA = scorePotentialBrand(a, html, domainName);
        const scoreB = scorePotentialBrand(b, html, domainName);
        return scoreB - scoreA;
      });

    // Se não encontrou nenhuma marca mas tem padrões claros nos títulos, usar o mais frequente
    if (uniqueBrands.length === 0) {
      const productTitles = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi) || [];
      const prefixCount = new Map<string, number>();
      const commonWords = ['shop', 'store', 'loja', 'site', 'app', 'online', 'oficial', 'original'];
      
      productTitles.forEach(title => {
        const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
        const firstWord = cleanTitle.split(/[\s-]+/)[0];
        if (firstWord && firstWord.length > 3) {
          prefixCount.set(firstWord, (prefixCount.get(firstWord) || 0) + 1);
        }
      });

      // Se encontrar um prefixo que aparece em pelo menos 3 títulos
      const mostCommonPrefix = Array.from(prefixCount.entries())
        .filter(([word]) => !commonWords.includes(word.toLowerCase()))
        .sort(([,a], [,b]) => b - a)[0];
        
      if (mostCommonPrefix && mostCommonPrefix[1] >= 3) {
        uniqueBrands.push(mostCommonPrefix[0]);
      }
    }

    return {
      title,
      description,
      keywords,
      forms: hasForms,
      loginFields: hasLoginForm,
      brandImages: hasBrandImages,
      securityIcons: hasSecurityIcons,
      fullContent: textContent,
      potentialBrands: uniqueBrands
    };
  } catch (error) {
    console.error('Erro ao analisar HTML:', error);
    return {
      title: '',
      description: '',
      keywords: [],
      forms: false,
      loginFields: false,
      brandImages: false,
      securityIcons: false,
      fullContent: '',
      potentialBrands: []
    };
  }
}

function getSectorContext(category: string): any {
  const contexts: {[key: string]: any} = {
    'Health & Supplements': {
      terms: ['adulterated supplements', 'health registrations', 'sanitary certifications'],
      impact: 'risk to consumer health and safety',
      urgency: 'CRITICAL'
    },
    'Beauty & Personal Care': {
      terms: ['counterfeit cosmetics', 'regulatory compliance', 'safety certifications'],
      impact: 'risk of adverse reactions and health complications',
      urgency: 'HIGH'
    },
    'Fashion': {
      terms: ['counterfeit products', 'copyright infringement', 'intellectual property'],
      impact: 'financial and reputational damage',
      urgency: 'MEDIUM'
    },
    'E-commerce': {
      terms: ['payment data', 'credentials', 'personal information'],
      impact: 'theft of financial data',
      urgency: 'HIGH'
    },
    'Financial Services': {
      terms: ['banking credentials', 'financial data', 'critical access'],
      impact: 'direct financial losses',
      urgency: 'CRITICAL'
    },
    'Auctions & Auctioneers': {
      terms: ['forged documents', 'fraudulent bids', 'identity theft'],
      impact: 'auction process fraud',
      urgency: 'HIGH'
    }
  };
  return contexts[category] || {
    terms: ['sensitive data', 'personal information', 'credentials'],
    impact: 'data compromise',
    urgency: 'HIGH'
  };
}

function generateTakedownText(data: any) {
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
  if (indicators.some((i: string) => i.includes('login') || i.includes('senha'))) {
    risks.push('credential theft attempt');
  }
  if (indicators.some((i: string) => i.includes('marca') || i.includes('logo'))) {
    risks.push('brand impersonation');
  }
  if (indicators.some((i: string) => i.includes('payment') || i.includes('cartão'))) {
    risks.push('payment data collection');
  }

  // Determine template type based on host info
  const isHostingProvider = data.ip_info?.company?.name?.toLowerCase().includes('hosting') || false;
  const isCloudProvider = data.ip_info?.company?.name?.toLowerCase().match(/(aws|azure|google|cloud)/i) !== null;
  
  // Build the base information block
  const baseInfo = `Domain: ${data.domain}
IP Address: ${data.ip || 'N/A'}`;

  // Build company description based on brand and category
  let companyDescription = '';
  switch (data.brand_category) {
    case 'Supplements':
      companyDescription = `${brand}, one of Brazil's leading sports nutrition and supplement companies`;
      break;
    case 'Retail':
      companyDescription = `${brand}, one of the largest retail chains in Brazil`;
      break;
    case 'Financial Services':
      companyDescription = `${brand}, a major Brazilian financial institution`;
      break;
    case 'E-commerce':
      companyDescription = `${brand}, a prominent Brazilian e-commerce platform`;
      break;
    case 'Insurance':
      companyDescription = `${brand}, a leading insurance company in Brazil`;
      break;
    case 'Fintech':
      companyDescription = `${brand}, an innovative Brazilian digital financial services company`;
      break;
    case 'Beauty & Cosmetics':
      companyDescription = `${brand}, a renowned Brazilian beauty and cosmetics company`;
      break;
    case 'Fashion':
      companyDescription = `${brand}, a major Brazilian fashion retailer`;
      break;
    case 'Pharmacy':
      companyDescription = `${brand}, one of Brazil's largest pharmacy retail chains`;
      break;
    case 'Airlines':
      companyDescription = `${brand}, a major Brazilian airline company`;
      break;
    case 'Telecom':
      companyDescription = `${brand}, a leading telecommunications provider in Brazil`;
      break;
    case 'Streaming':
      companyDescription = `${brand}, a popular streaming service provider`;
      break;
    case 'Food Delivery':
      companyDescription = `${brand}, a major food delivery platform in Brazil`;
      break;
    case 'Education':
      companyDescription = `${brand}, a prominent Brazilian educational institution`;
      break;
    case 'Gaming':
      companyDescription = `${brand}, a major gaming and entertainment platform`;
      break;
    case 'Automotive':
      companyDescription = `${brand}, a leading automotive marketplace in Brazil`;
      break;
    case 'Real Estate':
      companyDescription = `${brand}, a prominent real estate platform in Brazil`;
      break;
    case 'Travel':
      companyDescription = `${brand}, a major travel and hospitality company`;
      break;
    case 'Digital Payments':
      companyDescription = `${brand}, a leading digital payment solutions provider in Brazil`;
      break;
    case 'Cryptocurrency':
      companyDescription = `${brand}, a prominent cryptocurrency exchange platform in Brazil`;
      break;
    case 'Government Services':
      companyDescription = `${brand}, an essential Brazilian government service platform`;
      break;
    case 'Healthcare':
      companyDescription = `${brand}, a major healthcare services provider in Brazil`;
      break;
    case 'Sports Betting':
      companyDescription = `${brand}, a regulated sports betting platform in Brazil`;
      break;
    case 'Logistics':
      companyDescription = `${brand}, a leading logistics and delivery services company in Brazil`;
      break;
    case 'Job Portals':
      companyDescription = `${brand}, one of Brazil's largest employment and recruitment platforms`;
      break;
    case 'Cloud Services':
      companyDescription = `${brand}, a major cloud computing and services provider`;
      break;
    case 'Social Networks':
      companyDescription = `${brand}, a popular social networking platform`;
      break;
    case 'Entertainment':
      companyDescription = `${brand}, a major entertainment and media company in Brazil`;
      break;
    case 'Marketplaces':
      companyDescription = `${brand}, a leading peer-to-peer marketplace platform in Brazil`;
      break;
    case 'Investment Platforms':
      companyDescription = `${brand}, a prominent investment and trading platform in Brazil`;
      break;
    case 'Utilities':
      companyDescription = `${brand}, an essential utility services provider in Brazil`;
      break;
    case 'Dating Apps':
      companyDescription = `${brand}, a popular online dating platform in Brazil`;
      break;
    case 'NFT & Digital Art':
      companyDescription = `${brand}, a leading NFT and digital art marketplace`;
      break;
    case 'Loyalty Programs':
      companyDescription = `${brand}, a major customer loyalty and rewards program in Brazil`;
      break;
    case 'Digital Wallets':
      companyDescription = `${brand}, a prominent digital wallet and payment services provider in Brazil`;
      break;
    case 'Classified Ads':
      companyDescription = `${brand}, one of Brazil's largest classified advertisements platforms`;
      break;
    case 'News & Media':
      companyDescription = `${brand}, a major Brazilian news and media organization`;
      break;
    case 'Professional Services':
      companyDescription = `${brand}, a leading professional services platform in Brazil`;
      break;
    default:
      companyDescription = brand;
  }

  // Build the evidence block
  const evidenceBlock = `${risks.length > 0 ? `\nThis fraudulent website has been confirmed to engage in ${risks.join(', ')}.` : ''}${indicators.length > 3 ? `\n\nOur analysis identified multiple high-risk indicators including suspicious authentication forms and unauthorized brand assets.` : ''}${data.whois_info?.creation_date !== 'N/A' ? `\nThe domain's recent registration (${data.whois_info.creation_date}) suggests this is part of an active phishing campaign.` : ''}`;

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

async function getIpAddress(domain: string): Promise<string | null> {
  try {
    // Primeiro tenta usar o Google DNS
    const googleDnsResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
    const googleDnsData = await googleDnsResponse.json();
    
    if (googleDnsData.Answer && googleDnsData.Answer[0]?.data) {
      console.log('IP obtido via Google DNS:', googleDnsData.Answer[0].data);
      return googleDnsData.Answer[0].data;
    }

    // Se falhar, tenta usar o Cloudflare DNS
    const cloudflareDnsResponse = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const cloudflareDnsData = await cloudflareDnsResponse.json();
    
    if (cloudflareDnsData.Answer && cloudflareDnsData.Answer[0]?.data) {
      console.log('IP obtido via Cloudflare DNS:', cloudflareDnsData.Answer[0].data);
      return cloudflareDnsData.Answer[0].data;
    }

    // Se ainda falhar, tenta resolver usando um servidor DNS alternativo
    const quad9DnsResponse = await fetch(`https://dns.quad9.net:5053/dns-query?name=${domain}&type=A`, {
      headers: { 'Accept': 'application/dns-json' }
    });
    const quad9DnsData = await quad9DnsResponse.json();
    
    if (quad9DnsData.Answer && quad9DnsData.Answer[0]?.data) {
      console.log('IP obtido via Quad9 DNS:', quad9DnsData.Answer[0].data);
      return quad9DnsData.Answer[0].data;
    }

    console.log('Não foi possível obter o IP usando nenhum dos serviços DNS');
    return null;
  } catch (error) {
    console.error('Erro ao obter IP:', error);
    return null;
  }
}

async function getWhoisInfo(domain: string): Promise<any> {
  const maxRetries = 3;
  const baseDelay = 1000; // 1 segundo

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Remove apenas www. do início do domínio, mantendo o domínio completo
      const baseDomain = domain.replace(/^www\./, '');
      console.log(`Consultando WHOIS para domínio: ${baseDomain} (tentativa ${attempt + 1}/${maxRetries})`);

      // Remover protocolo e path, manter apenas o domínio base
      const cleanDomain = baseDomain.replace(/^https?:\/\//, '').split('/')[0];
      console.log('Domínio limpo para consulta WHOIS:', cleanDomain);

      const whoisResponse = await fetch(`https://api.apilayer.com/whois/query?domain=${cleanDomain}`, {
        method: 'GET',
        headers: {
          'apikey': 'U7DXr83jjZ4v8idMPCYwVDm1o6pAUbt0'
        }
      });

      if (!whoisResponse.ok) {
        // Se for erro 524 ou 5xx, tenta novamente
        if (whoisResponse.status === 524 || (whoisResponse.status >= 500 && whoisResponse.status < 600)) {
          console.log(`Erro ${whoisResponse.status} recebido, tentando novamente em ${(baseDelay * (attempt + 1))/1000} segundos...`);
          await new Promise(resolve => setTimeout(resolve, baseDelay * (attempt + 1)));
          continue;
        }
        
        // Log do erro completo para debug
        const errorText = await whoisResponse.text();
        console.error('Erro detalhado da APILayer:', errorText);
        throw new Error(`HTTP error! status: ${whoisResponse.status}, details: ${errorText}`);
      }

      const whoisData = await whoisResponse.json();
      console.log('Resposta da APILayer:', whoisData); // Debug
      
      // Ajuste na verificação da resposta
      if (!whoisData || !whoisData.result) {
        throw new Error('Invalid WHOIS response');
      }

      const result = whoisData.result;

      return {
        registrar: result.registrar || 'N/A',
        creation_date: result.creation_date || 'N/A',
        expiration_date: result.expiration_date || 'N/A',
        nameservers: result.name_servers || ['N/A'],
        registrar_abuse_contact_email: result.emails || 'N/A',
        raw: JSON.stringify(whoisData)
      };

    } catch (error) {
      console.error(`Erro ao consultar WHOIS (tentativa ${attempt + 1}/${maxRetries}):`, error);
      
      // Se for a última tentativa, retorna o objeto de erro
      if (attempt === maxRetries - 1) {
        return {
          registrar: 'N/A',
          creation_date: 'N/A',
          expiration_date: 'N/A',
          nameservers: ['N/A'],
          registrar_abuse_contact_email: 'N/A',
          raw: ''
        };
      }
      
      // Espera antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, baseDelay * (attempt + 1)));
    }
  }
}

// Nova função para gerar relatório de análise detalhado
function generateAnalysisReport(data: any) {
  const brand = data.detected_brand?.name || 'Unknown Brand';
  const category = data.brand_category || 'Unknown Category';
  const indicators = data.phishing_indicators || [];
  const registrationDate = data.whois_info?.creation_date || 'N/A';

  // Determinar nível de risco baseado em indicadores
  let riskLevel = '🟡 MÉDIO';
  let riskColor = '🟡';
  if (indicators.length > 5) {
    riskLevel = '🔴 ALTO';
    riskColor = '🔴';
  } else if (indicators.length < 3) {
    riskLevel = '🟢 BAIXO';
    riskColor = '🟢';
  }

  // Categorizar indicadores
  const categories = {
    authentication: indicators.filter((i: string) => i.includes('login') || i.includes('senha') || i.includes('form')),
    brand: indicators.filter((i: string) => i.includes('marca') || i.includes('logo') || i.includes('imagem')),
    technical: indicators.filter((i: string) => i.includes('ssl') || i.includes('dns') || i.includes('registro')),
    behavioral: indicators.filter((i: string) => i.includes('recente') || i.includes('suspeito') || i.includes('similar'))
  };

  // Gerar badges de status
  const statusBadges = [];
  if (indicators.some((i: string) => i.includes('login'))) statusBadges.push('🔒 Roubo de Credenciais');
  if (indicators.some((i: string) => i.includes('marca'))) statusBadges.push('🏢 Brand Abuse');
  if (indicators.some((i: string) => i.includes('recente'))) statusBadges.push('⚡ Campanha Ativa');
  if (indicators.some((i: string) => i.includes('ssl'))) statusBadges.push('🔐 SSL Malicioso');

  // Determinar descrição baseada na categoria
  let categoryDescription = '';
  switch(category.toLowerCase()) {
    case 'banking':
    case 'banks & financial':
      categoryDescription = `🏦 Campanha de phishing direcionada a clientes do ${brand}. Tentativa de roubo de credenciais bancárias e dados financeiros.`;
      break;
    case 'airlines':
      categoryDescription = `✈️ Operação fraudulenta visando clientes da ${brand}. Foco em roubo de dados de cartão e milhas aéreas.`;
      break;
    case 'e-commerce':
      categoryDescription = `🛒 Campanha maliciosa imitando a plataforma ${brand}. Objetivo de capturar dados de pagamento de compradores.`;
      break;
    case 'social media':
      categoryDescription = `📱 Ataque direcionado a usuários do ${brand}. Tentativa de comprometimento de contas e roubo de dados pessoais.`;
      break;
    case 'streaming':
      categoryDescription = `🎬 Campanha fraudulenta visando usuários do ${brand}. Tentativa de roubo de credenciais de streaming.`;
      break;
    case 'delivery':
      categoryDescription = `🛵 Ataque direcionado a usuários do ${brand}. Foco em roubo de dados de pagamento e credenciais.`;
      break;
    default:
      categoryDescription = `🎯 Campanha de phishing detectada visando a marca ${brand}.`;
  }

  return `⚠️ RELATÓRIO DE ANÁLISE DE AMEAÇA
═══════════════════════════════
${riskColor} Nível de Risco: ${riskLevel}
${statusBadges.length > 0 ? statusBadges.join(' | ') : ''}

🎯 Alvo Identificado
• Marca: ${brand}
• Categoria: ${category}
• Data Registro: ${registrationDate}

📝 Resumo da Análise
${categoryDescription}

🚨 Indicadores de Ameaça
${categories.authentication.length > 0 ? `🔐 Autenticação
${categories.authentication.map((i: string) => `• ${i}`).join('\n')}` : ''}
${categories.authentication.length > 0 && (categories.brand.length > 0 || categories.technical.length > 0 || categories.behavioral.length > 0) ? '\n' : ''}${categories.brand.length > 0 ? `🏢 Abuso de Marca
${categories.brand.map((i: string) => `• ${i}`).join('\n')}` : ''}
${categories.brand.length > 0 && (categories.technical.length > 0 || categories.behavioral.length > 0) ? '\n' : ''}${categories.technical.length > 0 ? `⚙️ Indicadores Técnicos
${categories.technical.map((i: string) => `• ${i}`).join('\n')}` : ''}
${categories.technical.length > 0 && categories.behavioral.length > 0 ? '\n' : ''}${categories.behavioral.length > 0 ? `🔍 Padrões Comportamentais
${categories.behavioral.map((i: string) => `• ${i}`).join('\n')}` : ''}

📊 Métricas de Impacto
• Severidade: ${riskLevel}
• Indicadores Detectados: ${indicators.length}
• Localização: ${data.ip_info?.asn?.country || 'Desconhecida'}

⚡ Status: ${indicators.length > 0 ? 'Ameaça Ativa' : 'Em Análise'}

Análise gerada por sistema automatizado de detecção de ameaças.`;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const url = data.url;
    
    if (!url) {
      return NextResponse.json({ error: 'URL não fornecida' }, { status: 400 });
    }

    console.log('Recebida requisição para analisar:', url);
    
    // Validar URL
    try {
      new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    // Extrair domínio
    const domain = extractDomain(url);
    if (!domain) {
      return NextResponse.json({ error: 'Não foi possível extrair o domínio da URL' }, { status: 400 });
    }
    console.log('Domínio extraído:', domain);

    // Analisar conteúdo HTML com tratamento de erro
    let htmlAnalysis;
    try {
      htmlAnalysis = await analyzeHtmlContent(url);
    } catch (error) {
      console.error('Erro ao analisar HTML:', error);
      htmlAnalysis = {
        title: '',
        description: '',
        keywords: [],
        forms: false,
        loginFields: false,
        brandImages: false,
        securityIcons: false,
        fullContent: '',
        potentialBrands: []
      };
    }

    // Detectar marca do domínio
    let detectedBrand = null;
    try {
      detectedBrand = await detectBrandFromDomain(domain, htmlAnalysis.title + htmlAnalysis.description, htmlAnalysis.potentialBrands);
    } catch (error) {
      console.error('Erro ao detectar marca:', error);
    }
    
    // Obter IP usando múltiplas fontes com retry
    console.log('Obtendo endereço IP...');
    let ip = null;
    let retryCount = 0;
    while (!ip && retryCount < 3) {
      try {
        ip = await getIpAddress(domain);
        if (ip) break;
      } catch (error) {
        console.error(`Tentativa ${retryCount + 1} falhou ao obter IP:`, error);
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo entre tentativas
    }
    console.log('IP obtido:', ip);

    if (!ip) {
      return NextResponse.json({
        error: 'Não foi possível obter o IP do domínio após múltiplas tentativas'
      }, { status: 400 });
    }

    // Consultar WHOIS com retry
    console.log('Consultando WHOIS...');
    let whoisInfo = null;
    retryCount = 0;
    while (!whoisInfo && retryCount < 3) {
      try {
        whoisInfo = await getWhoisInfo(domain);
        if (whoisInfo && whoisInfo.registrar !== 'N/A') break;
      } catch (error) {
        console.error(`Tentativa ${retryCount + 1} falhou ao consultar WHOIS:`, error);
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!whoisInfo) {
      whoisInfo = {
        registrar: 'N/A',
        creation_date: 'N/A',
        expiration_date: 'N/A',
        nameservers: ['N/A'],
        registrar_abuse_contact_email: 'N/A',
        raw: ''
      };
    }
    console.log('Informações WHOIS:', whoisInfo);

    // Consultar informações detalhadas do IP usando ipapi.is com API KEY
    console.log('Consultando informações detalhadas do IP...');
    const IPAPI_IS_KEY = '70a7f3f869cfd36a';
    let ipapiIsInfo = null;
    
    if (ip !== 'N/A') {
      try {
        const ipapiIsResponse = await fetch('https://api.ipapi.is', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            q: ip,
            key: IPAPI_IS_KEY
          })
        });
        
        if (!ipapiIsResponse.ok) {
          throw new Error(`HTTP error! status: ${ipapiIsResponse.status}`);
        }
        
        const responseText = await ipapiIsResponse.text();
        console.log('Resposta bruta IPAPI.is:', responseText);
        
        try {
          ipapiIsInfo = JSON.parse(responseText);
        } catch (e) {
          console.error('Erro ao fazer parse da resposta:', e);
        }
        
        console.log('Resposta IPAPI.is processada:', ipapiIsInfo);
      } catch (error) {
        console.error('Erro ao consultar IPAPI.is:', error);
      }
    }

    // Determinar o Hosting Provider e informações de abuso
    const hostingProvider = ipapiIsInfo?.company?.name || 'N/A';
    const abuseInfo = {
      name: ipapiIsInfo?.abuse?.name || whoisInfo.registrar || 'N/A',
      email: ipapiIsInfo?.abuse?.email || whoisInfo.registrar_abuse_contact_email || 'N/A',
      phone: ipapiIsInfo?.abuse?.phone || whoisInfo.raw.match(/Registrar Abuse Contact Phone:\s*([^\n]+)/)?.[1] || 'N/A',
      address: ipapiIsInfo?.abuse?.address || 'N/A'
    };

    // Obter registros DNS com mais detalhes
    console.log('Obtendo registros DNS...');
    const [a, mx, ns, txt] = await Promise.all([
      fetch(`https://dns.google/resolve?name=${domain}&type=A`).then(r => r.json()),
      fetch(`https://dns.google/resolve?name=${domain}&type=MX`).then(r => r.json()),
      fetch(`https://dns.google/resolve?name=${domain}&type=NS`).then(r => r.json()),
      fetch(`https://dns.google/resolve?name=${domain}&type=TXT`).then(r => r.json())
    ]);

    const dns_records = {
      A: a.Answer?.map((record: any) => record.data) || [],
      MX: mx.Answer?.map((record: any) => record.data) || [],
      NS: ns.Answer?.map((record: any) => record.data) || [],
      TXT: txt.Answer?.map((record: any) => record.data) || []
    };

    // Identificar indicadores de phishing
    const phishingIndicators = [];
    
    if (htmlAnalysis.loginFields) phishingIndicators.push('Campos de login detectados');
    if (htmlAnalysis.brandImages) phishingIndicators.push('Imagens de marca detectadas');
    if (htmlAnalysis.securityIcons) phishingIndicators.push('Ícones de segurança suspeitos');
    if (detectedBrand) phishingIndicators.push(`Uso não autorizado da marca ${detectedBrand.name}`);
    if (whoisInfo.creation_date !== 'N/A' && new Date(whoisInfo.creation_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      phishingIndicators.push('Domínio registrado recentemente');
    }

    // Preparar resposta final com todas as informações
    const response = {
      domain,
      ip,
      whois_info: whoisInfo,
      ip_info: {
        abuse_contact: abuseInfo.email,
        company: {
          name: hostingProvider,
          abuse: {
            ...abuseInfo,
            email: abuseInfo.email !== 'N/A' ? abuseInfo.email : whoisInfo.registrar_abuse_contact_email
          }
        },
        asn: {
          asn: ipapiIsInfo?.asn?.asn || 'N/A',
          org: ipapiIsInfo?.asn?.org || 'N/A',
          country: ipapiIsInfo?.asn?.country || 'N/A',
          descr: ipapiIsInfo?.asn?.descr || 'N/A',
          route: ipapiIsInfo?.asn?.route || 'N/A',
          type: ipapiIsInfo?.asn?.type || 'N/A',
          abuser_score: ipapiIsInfo?.asn?.abuser_score || 'N/A',
          domain: ipapiIsInfo?.asn?.domain || 'N/A',
          created: ipapiIsInfo?.asn?.created || 'N/A',
          updated: ipapiIsInfo?.asn?.updated || 'N/A',
          rir: ipapiIsInfo?.asn?.rir || 'N/A',
          whois: ipapiIsInfo?.asn?.whois || 'N/A'
        }
      },
      dns_records,
      html_analysis: htmlAnalysis,
      detected_brand: detectedBrand,
      brand_category: detectedBrand?.category || 'Unknown',
      phishing_indicators: phishingIndicators,
      risk_score: detectedBrand ? 0.9 : 0.5,
      analysis_text: generateAnalysisReport({
        detected_brand: detectedBrand,
        brand_category: detectedBrand?.category || 'Unknown',
        whois_info: whoisInfo,
        ip_info: {
          asn: {
            country: ipapiIsInfo?.asn?.country
          }
        },
        phishing_indicators: phishingIndicators
      }),
      takedown_text: generateTakedownText({
        domain,
        ip,
        ip_info: {
          company: {
            name: hostingProvider,
            abuse: abuseInfo
          },
          asn: {
            org: ipapiIsInfo?.asn?.org || hostingProvider
          }
        },
        whois_info: whoisInfo,
        detected_brand: detectedBrand,
        brand_category: detectedBrand?.category || 'Unknown',
        phishing_indicators: phishingIndicators
      })
    };

    console.log('Resposta final:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Erro na análise:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao analisar domínio' },
      { status: 500 }
    );
  }
}