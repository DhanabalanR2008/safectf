import { GoogleGenAI } from '@google/genai'

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export interface ExtractedCtf {
  name?: string
  ctfUrl?: string
  sourceUrl?: string
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  registrationDeadline?: string
  teamSize?: number
  description?: string
  source?: 'UNSTOP' | 'CTFTIME' | 'MANUAL'
}

export async function extractCtfDetails(text: string, sourceUrl?: string): Promise<ExtractedCtf> {
  const prompt = `You are an expert CTF & Hackathon competition metadata extractor.
Analyze the following CTF details or webpage content and extract all structured data. Return ONLY a valid JSON object without markdown or commentary.

Extract these fields (use null for unknown/missing fields):
- name: string (Official competition name)
- ctfUrl: string (Competition registration or official portal URL)
- startDate: string (Start date in YYYY-MM-DD format)
- startTime: string (Start time in 24h format HH:MM, default "09:00" if unspecified)
- endDate: string (End date in YYYY-MM-DD format)
- endTime: string (End time in 24h format HH:MM, default "18:00" if unspecified)
- registrationDeadline: string (Registration deadline in ISO 8601 format or YYYY-MM-DDTHH:MM, or null)
- teamSize: number (Allowed team size or max members, integer e.g. 6 or null)
- description: string (Brief 2-3 sentence overview of themes, rounds, and eligibility)

IMPORTANT:
- Ensure startDate and endDate are valid calendar dates. If a range is given (e.g. "March 28-30, 2026"), set startDate to "2026-03-28" and endDate to "2026-03-30".
- If times are mentioned in other timezones (UTC/PST/EST/IST), convert them to IST (+05:30).
- Return ONLY the JSON object.

Content:
${text.slice(0, 15000)}`

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    const raw = response.text?.trim() ?? '{}'
    const cleaned = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as ExtractedCtf

    if (sourceUrl) {
      parsed.sourceUrl = sourceUrl
      if (!parsed.ctfUrl) parsed.ctfUrl = sourceUrl
      if (sourceUrl.includes('unstop.com')) parsed.source = 'UNSTOP'
      else if (sourceUrl.includes('ctftime.org')) parsed.source = 'CTFTIME'
      else parsed.source = 'MANUAL'
    }

    return parsed
  } catch (error) {
    console.error('Gemini extraction error:', error)
    return {}
  }
}

export async function extractFromUrl(url: string): Promise<ExtractedCtf> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch URL: ${res.status} ${res.statusText}`)
    }

    const html = await res.text()

    // Clean HTML to extract text content
    const textOnly = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return await extractCtfDetails(textOnly, url)
  } catch (err: any) {
    console.error('extractFromUrl error:', err)
    return {
      sourceUrl: url,
      ctfUrl: url,
      source: url.includes('unstop.com') ? 'UNSTOP' : url.includes('ctftime.org') ? 'CTFTIME' : 'MANUAL',
    }
  }
}
