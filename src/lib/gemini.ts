import { GoogleGenAI } from '@google/genai'

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })

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

// Check if a title string is an invalid generic site slogan or header
export function isInvalidTitle(title?: string | null): boolean {
  if (!title) return true
  const lower = title.toLowerCase().trim()
  const blacklist = [
    'corporates',
    'students',
    'competitions',
    'hackathons',
    'scholarships',
    'internships',
    'unstop',
    'ctftime',
    'ctftime.org',
    'unstop - competitions',
    'new ctf',
    'untitled',
    'home',
  ]
  if (blacklist.includes(lower)) return true
  if (lower.includes('competitions, quizzes') || lower.includes('for students and corporates')) return true
  if (lower.length < 3) return true
  return false
}

// Extract human-readable title from an Unstop or other URL slug
export function extractTitleFromUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr)
    const segments = url.pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    // For URLs like /hackathons/my-hackathon-name-123456 or /competitions/my-comp-123456
    const last = segments[segments.length - 1]
    if (last === 'o' || segments[0] === 'o') return null // short link code

    // Strip trailing numeric ID if any (e.g. -123456)
    const cleaned = last.replace(/-\d{4,}$/, '').replace(/[-_]+/g, ' ')
    if (isInvalidTitle(cleaned)) return null

    // Title case
    return cleaned
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  } catch {
    return null
  }
}

// Smart heuristic fallback if AI is slow or rate-limited
export function extractHeuristics(text: string, sourceUrl?: string): ExtractedCtf {
  const isUnstop = sourceUrl?.includes('unstop.com')
  const isCtftime = sourceUrl?.includes('ctftime.org')

  const result: ExtractedCtf = {
    source: isUnstop ? 'UNSTOP' : isCtftime ? 'CTFTIME' : 'MANUAL',
    sourceUrl: sourceUrl || undefined,
    ctfUrl: sourceUrl || undefined,
  }

  // 1. Name heuristics
  if (sourceUrl) {
    const slugTitle = extractTitleFromUrl(sourceUrl)
    if (slugTitle && !isInvalidTitle(slugTitle)) {
      result.name = slugTitle
    }
  }

  if (!result.name) {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => {
      return (
        l.length > 0 &&
        !isInvalidTitle(l) &&
        !l.toLowerCase().startsWith('http') &&
        !l.includes('d8it4huxumps7')
      )
    })
    if (lines.length > 0 && !isInvalidTitle(lines[0])) {
      result.name = lines[0].replace(/^["']|["']$/g, '').slice(0, 100)
    } else {
      result.name = ''
    }
  }

  // 2. Team size heuristic
  const teamMatch =
    text.match(/team\s*(?:size|of|members)?\s*[:=-]?\s*(\d+)/i) ||
    text.match(/(\d+)\s*(?:members?|players?)\s*(?:per|in a)?\s*team/i) ||
    text.match(/max(?:imum)?\s*team\s*size\s*[:=-]?\s*(\d+)/i)
  if (teamMatch) {
    const size = parseInt(teamMatch[1], 10)
    if (size >= 1 && size <= 100) result.teamSize = size
  }

  // 3. Date heuristics
  const dateRegex = /\b(\d{4}-\d{2}-\d{2})\b/g
  const datesFound = Array.from(text.matchAll(dateRegex)).map((m) => m[1])
  if (datesFound.length >= 2) {
    result.startDate = datesFound[0]
    result.endDate = datesFound[1]
  } else if (datesFound.length === 1) {
    result.startDate = datesFound[0]
    result.endDate = datesFound[0]
  } else {
    // Default to tomorrow 09:00 - 18:00
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    result.startDate = tomorrow.toISOString().split('T')[0]
    result.endDate = tomorrow.toISOString().split('T')[0]
  }

  result.startTime = '09:00'
  result.endTime = '18:00'
  result.description =
    text.length > 20 && !isInvalidTitle(text)
      ? text.slice(0, 1000)
      : isUnstop
      ? 'Registered via Unstop.'
      : ''

  return result
}

export async function extractCtfDetails(text: string, sourceUrl?: string): Promise<ExtractedCtf> {
  const isUnstop = sourceUrl?.includes('unstop.com')
  const isCtftime = sourceUrl?.includes('ctftime.org')
  const slugTitle = sourceUrl ? extractTitleFromUrl(sourceUrl) : null

  // Fast check: if no GEMINI_API_KEY or text is minimal, return heuristics immediately
  if (!process.env.GEMINI_API_KEY || text.length < 10) {
    return extractHeuristics(text, sourceUrl)
  }

  const prompt = `You are an expert CTF & Hackathon metadata extractor.
Extract all competition details from the provided content and return ONLY valid JSON without markdown formatting.

Guidelines:
- name: Competition title (e.g. "${slugTitle || 'CyberWar CTF 2026'}"). NEVER return generic site headers like "Unstop - Competitions", "Corporates", "Students", or "CTFtime.org". If unknown, return "".
- ctfUrl: Registration or competition portal URL if present
- startDate: Start date in YYYY-MM-DD format (convert any timezone to IST / UTC+5:30 if specified)
- startTime: Start time in HH:MM (24-hour format, default "09:00")
- endDate: End date in YYYY-MM-DD format
- endTime: End time in HH:MM (24-hour format, default "18:00")
- registrationDeadline: Registration deadline datetime in YYYY-MM-DDTHH:MM or null
- teamSize: Maximum allowed team size integer (e.g. 1 to 6) or null
- description: Concise 2-3 sentence overview or rules summary

Source URL: ${sourceUrl || 'N/A'}
Text Content:
${text.slice(0, 8000)}`

  try {
    const geminiPromise = client.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
      store: false,
    })

    // Strict 5s timeout to prevent Netlify function timeouts
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 5000)
    )

    const response = await Promise.race([geminiPromise, timeoutPromise])

    const raw = response.output_text?.trim() ?? '{}'
    const cleaned = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(cleaned) as ExtractedCtf

    if (sourceUrl) {
      parsed.sourceUrl = sourceUrl
      if (!parsed.ctfUrl) parsed.ctfUrl = sourceUrl
      parsed.source = isUnstop ? 'UNSTOP' : isCtftime ? 'CTFTIME' : 'MANUAL'
    }

    if (isInvalidTitle(parsed.name)) {
      parsed.name = slugTitle && !isInvalidTitle(slugTitle) ? slugTitle : ''
    }

    if (!parsed.startDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      parsed.startDate = tomorrow.toISOString().split('T')[0]
    }
    if (!parsed.endDate) parsed.endDate = parsed.startDate
    if (!parsed.startTime) parsed.startTime = '09:00'
    if (!parsed.endTime) parsed.endTime = '18:00'

    return parsed
  } catch (error) {
    console.warn('Gemini AI fallback triggered:', error)
    return extractHeuristics(text, sourceUrl)
  }
}

// Extract numeric event ID from an Unstop URL slug
// e.g. https://unstop.com/hackathons/my-ctf-event-1234567 → "1234567"
// Returns null for short links like /o/AbCd
function extractUnstopEventId(url: string): string | null {
  if (/unstop\.com\/o\//i.test(url)) return null
  const match = url.match(/-(\d{5,})(?:[/?#]|$)/)
  return match?.[1] ?? null
}

// Directly call the Unstop public API to get event details
async function fetchFromUnstopApi(url: string): Promise<ExtractedCtf | null> {
  const eventId = extractUnstopEventId(url)
  if (!eventId) return null

  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 5000)

    const apiUrl = `https://unstop.com/api/public/competition/${eventId}?preview=undefined`
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json',
        Referer: 'https://unstop.com/',
      },
    })

    if (!res.ok) return null
    const json = await res.json() as { data?: { status?: boolean; competition?: Record<string, unknown> } }
    const comp = json?.data?.competition
    if (!comp || !json?.data?.status) return null

    const title = (comp.title as string | null) ?? ''
    const startRaw = comp.start_date as string | null
    const endRaw = comp.end_date as string | null
    const webUrl = (comp.web_url as string | null) || null
    const publicUrl = (comp.seo_url as string | null) || (comp.public_url as string | null) || null
    const pageUrl = publicUrl ? `https://unstop.com/${publicUrl}` : url
    const details = comp.details as string | null

    // Parse ISO dates with IST offset
    let startDate = ''
    let startTime = '09:00'
    let endDate = ''
    let endTime = '18:00'

    if (startRaw) {
      const d = new Date(startRaw)
      startDate = d.toISOString().split('T')[0]
      const totalMins = d.getUTCHours() * 60 + d.getUTCMinutes() + 330 // +5:30 IST
      startTime = `${String(Math.floor(totalMins / 60) % 24).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`
    }
    if (endRaw) {
      const d = new Date(endRaw)
      endDate = d.toISOString().split('T')[0]
      const totalMins = d.getUTCHours() * 60 + d.getUTCMinutes() + 330
      endTime = `${String(Math.floor(totalMins / 60) % 24).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`
    }
    if (!endDate) endDate = startDate

    // Team size from teams array
    const teams = comp.teams as Array<{ max_size?: number }> | null
    let teamSize: number | undefined
    if (Array.isArray(teams) && teams.length > 0 && teams[0]?.max_size) {
      const s = Number(teams[0].max_size)
      if (s >= 1 && s <= 100) teamSize = s
    }

    // Strip HTML from description
    const description = details
      ? details.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
      : 'Registered via Unstop.'

    return {
      name: title,
      source: 'UNSTOP',
      sourceUrl: url,
      ctfUrl: webUrl || pageUrl,
      startDate,
      startTime,
      endDate,
      endTime,
      teamSize,
      description,
    }
  } catch (err) {
    console.warn('Unstop API fetch failed:', err)
    return null
  }
}

export async function extractFromUrl(url: string): Promise<ExtractedCtf> {
  // For Unstop URLs: use the direct API — fast, accurate, no AI/scraping needed
  if (url.includes('unstop.com')) {
    const unstopResult = await fetchFromUnstopApi(url)
    if (unstopResult && unstopResult.name && !isInvalidTitle(unstopResult.name)) {
      return unstopResult
    }
    // Short link or deleted event — fall back to heuristics
    return extractHeuristics('', url)
  }

  // For all other URLs: fetch HTML + run through AI extraction
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    clearTimeout(timeoutId)

    const html = await res.text()

    // 1. Extract JSON-LD structured data if present
    let jsonLdContent = ''
    const jsonLdMatch = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    if (jsonLdMatch) {
      jsonLdContent = jsonLdMatch.map((tag) => tag.replace(/<[^>]+>/g, '').trim()).join('\n')
    }

    // 2. Extract meta tags
    const titleMatch =
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<title>([^<]+)<\/title>/i)
    const descMatch =
      html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)

    const title = titleMatch ? titleMatch[1].trim() : ''
    const desc = descMatch ? descMatch[1].trim() : ''

    // 3. Extract clean body text
    const textOnly = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const combinedContent = `${title}\n\n${desc}\n\n${jsonLdContent}\n\n${textOnly.slice(0, 4000)}`

    return await extractCtfDetails(combinedContent, url)
  } catch (err) {
    console.warn('extractFromUrl fetch timed out or failed, falling back to heuristics:', err)
    return extractHeuristics(url, url)
  }
}
export interface VoiceExtractedCtf {
  name?: string
  ctfUrl?: string
  startDate?: string   // YYYY-MM-DD
  startTime?: string   // HH:MM
  endDate?: string     // YYYY-MM-DD
  endTime?: string     // HH:MM
  teamSize?: number
  memberNames?: string[]  // raw names spoken, will be matched client-side
}

export async function extractCtfFromVoice(transcript: string): Promise<VoiceExtractedCtf> {
  if (!process.env.GEMINI_API_KEY || transcript.trim().length < 3) return {}

  const today = new Date().toISOString().split('T')[0]

  const prompt = `You are a helpful assistant that extracts CTF competition details from a spoken voice transcript.
Today's date is ${today}.

Extract these fields and return ONLY valid JSON (no markdown, no explanation):
- name: string — the CTF competition name (e.g. "CyberCTF" or "PicoCTF 2026"). null if not mentioned.
- ctfUrl: string — any URL/website mentioned. null if not mentioned.
- startDate: string — start date in YYYY-MM-DD format. If only day/month spoken without year, use current or next upcoming date. null if not mentioned.
- startTime: string — start time HH:MM (24h). Default "09:00" if a start date is given but no time.
- endDate: string — end date in YYYY-MM-DD format. null if not mentioned.
- endTime: string — end time HH:MM (24h). Default "18:00" if an end date is given but no time.
- teamSize: number — max team members count integer. null if not mentioned.
- memberNames: array of strings — names of people mentioned as team members (e.g. ["Abhishek", "Abinaya"]). Empty array [] if none mentioned.

Voice transcript:
"${transcript.trim()}"

Return ONLY a JSON object. Example:
{"name":"CyberCTF","ctfUrl":null,"startDate":"2026-10-26","startTime":"09:00","endDate":"2026-10-27","endTime":"18:00","teamSize":4,"memberNames":["Abhishek","Harijith"]}`

  try {
    const response = await client.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
      store: false,
    })

    const raw = response.output_text?.trim() ?? '{}'
    const cleaned = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim()
    return JSON.parse(cleaned) as VoiceExtractedCtf
  } catch (err) {
    console.warn('Voice extraction Gemini error:', err)
    return {}
  }
}
