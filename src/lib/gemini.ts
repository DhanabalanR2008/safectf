import { GoogleGenAI } from '@google/genai'

// This module is server-side only - never import from client components
const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export interface ExtractedCtf {
  name?: string
  ctfUrl?: string
  startDate?: string
  startTime?: string
  endDate?: string
  endTime?: string
  registrationDeadline?: string
  teamSize?: number
  description?: string
}

export async function extractCtfDetails(text: string): Promise<ExtractedCtf> {
  const prompt = `You are a CTF competition data extractor. Extract details from the text and return ONLY valid JSON.

Extract these fields (use null for missing values):
- name: string (CTF competition name)
- ctfUrl: string (website/registration URL if mentioned, must be a valid URL or null)
- startDate: string (ISO 8601 date format YYYY-MM-DD)
- startTime: string (HH:MM in 24h format)
- endDate: string (ISO 8601 date format YYYY-MM-DD)
- endTime: string (HH:MM in 24h format)
- registrationDeadline: string (ISO 8601 datetime or null)
- teamSize: number (maximum team members, integer or null)
- description: string (brief summary of the CTF)

IMPORTANT: Convert all times to IST (UTC+5:30) if timezone is mentioned. Return ONLY the JSON object, no markdown.

Text to extract from:
${text}`

  const interaction = await client.interactions.create({
    model: 'gemini-3.8-flash',
    input: prompt,
    store: false,
  })

  const raw = interaction.output_text?.trim() ?? '{}'
  // Strip markdown code blocks if present
  const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()

  try {
    return JSON.parse(cleaned) as ExtractedCtf
  } catch {
    return {}
  }
}
