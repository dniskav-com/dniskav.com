import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { SYSTEM_PROMPT } from '@/lib/ai-context'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ── Límites anti-abuso ────────────────────────────────────────
const MAX_MESSAGE_LENGTH = 1000
const MAX_HISTORY_MESSAGES = 20
const MAX_HISTORY_TEXT_LENGTH = 4000

// Rate limiting en memoria por IP: 10 peticiones por minuto.
// (Suficiente para un sitio personal; si se escala a varias instancias,
//  migrar a un limiter compartido tipo Redis.)
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX = 10
const hits = new Map<string, number[]>()
setInterval(() => hits.clear(), RATE_LIMIT_WINDOW_MS).unref?.()

function isRateLimited(ip: string): number {
  const now = Date.now()
  const timestamps = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (timestamps.length >= RATE_LIMIT_MAX) {
    hits.set(ip, timestamps)
    const oldest = timestamps[0]
    return Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000)
  }
  timestamps.push(now)
  hits.set(ip, timestamps)
  return 0
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req)

  const retryIn = isRateLimited(ip)
  if (retryIn > 0) {
    return NextResponse.json({ error: 'rate_limit', retryIn }, { status: 429 })
  }

  try {
    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const rawHistory = Array.isArray(body.history) ? body.history : []

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Validación estricta del historial: roles permitidos, texto plano y limitado
    const history = rawHistory
      .slice(-MAX_HISTORY_MESSAGES)
      .filter(
        (m: unknown): m is { role: 'user' | 'model'; text: string } =>
          typeof m === 'object' &&
          m !== null &&
          ((m as { role?: unknown }).role === 'user' || (m as { role?: unknown }).role === 'model') &&
          typeof (m as { text?: unknown }).text === 'string',
      )
      .map((m: { role: 'user' | 'model'; text: string }) => ({
        role: m.role,
        text: m.text.slice(0, MAX_HISTORY_TEXT_LENGTH),
      }))

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT,
    })

    const chat = model.startChat({
      history: history.map((m: { role: string; text: string }) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    })

    const result = await chat.sendMessage(message)
    const text = result.response.text()

    return NextResponse.json({ reply: text })
  } catch (err: unknown) {
    console.error('[chat] error:', err)
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 429) {
      const msg = String((err as { message?: string }).message ?? '')
      const match = msg.match(/retryDelay["\s:]+(\d+)s/)
      const geminiRetryIn = match ? parseInt(match[1], 10) : 60
      return NextResponse.json({ error: 'rate_limit', retryIn: geminiRetryIn }, { status: 429 })
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
