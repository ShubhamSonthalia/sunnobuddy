import { getFirebaseAuth } from '@/lib/firebase'

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '')

type ApiOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>
}

let activeIntakeSessionId: string | null = null

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  let token: string | null = null
  const auth = getFirebaseAuth()

  if (auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken()
    } catch (tokenErr) {
      console.warn('Could not retrieve current Firebase ID token:', tokenErr)
    }
  }

  // Fallback to stored guest or mock session if Firebase auth is not signed in
  if (!token && typeof window !== 'undefined') {
    try {
      const storedGuest = localStorage.getItem('sunnobuddy_guest_session')
      if (storedGuest) {
        const parsed = JSON.parse(storedGuest)
        if (parsed?.uid) {
          token = 'mock-guest-token-' + parsed.uid
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json, application/pdf, */*',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.body && typeof options.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  }

  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      cache: 'no-store',
      headers,
    })
  } catch (netErr) {
    const errorMsg = netErr instanceof Error ? netErr.message : String(netErr)
    throw new Error(
      `SunnoBuddy backend is currently unreachable at ${apiBaseUrl}. Please ensure the backend is running. (${errorMsg})`
    )
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    let detail = ''
    try {
      if (contentType.includes('application/json')) {
        const errorJson = await response.json()
        detail = errorJson.detail || errorJson.error || errorJson.message || ''
      } else {
        detail = await response.text()
      }
    } catch {
      // Ignore body parse errors
    }

    if (response.status === 401) {
      throw new Error(detail || 'Your session has expired. Please sign in again.')
    }
    if (response.status === 403) {
      throw new Error(detail || 'You do not have permission to access this resource.')
    }
    if (response.status === 404) {
      throw new Error(detail || 'The requested resource was not found.')
    }
    if (response.status === 422) {
      throw new Error(detail || 'Invalid request parameters. Please verify your input.')
    }
    throw new Error(detail || `The request could not be completed (${response.status}). Please try again.`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (contentType.includes('application/pdf')) {
    return (await response.blob()) as T
  }

  if (!contentType.includes('application/json')) {
    const textData = await response.text()
    return textData as T
  }

  const json = await response.json()
  // Backend returns standard envelope: { success: true, data: ..., message: ..., error: null }
  if (json && typeof json === 'object') {
    if (json.success === false && json.error) {
      throw new Error(json.error)
    }
    if ('data' in json && json.data !== undefined) {
      return json.data as T
    }
  }

  return json as T
}

export type MindLogEntry = {
  id: string
  title: string
  content: string
  date?: string
  created_at: string
  updated_at?: string
  analysis_status?: string
}

export type IntakeProgress = {
  completed_questions?: number
  total_questions?: number
  completion_percentage?: number
}

export type IntakeQuestion = IntakeProgress & {
  question: string
  question_id?: string
  completed?: boolean
  follow_up_required?: boolean
  follow_up_question?: string
}

export type MindLogReportResponse =
  | Blob
  | {
    success: boolean
    pdf_url?: string
    pdf_base64?: string
  }

export type EmotionAnalysis = {
  primaryEmotion: string
  confidence?: number
  distribution?: Record<string, number>
  analyzedAt?: string
}

export type ChatSession = {
  session_id: string
  conversation_id?: string
  title: string
  message_count?: number
  created_at: string
  updated_at?: string
}

export type ChatMessage = {
  id: string
  message_id?: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  timestamp?: string
}

export type IntakeUserStatus = {
  completed: boolean
  in_progress: boolean
  session_id?: string
  completed_at?: string
  answers_count?: number
  total_questions?: number
  current_question?: any
  progress?: any
  latest_report?: any
  assessment_report?: any
  report?: any
  version?: number
  total_assessments?: number
  monthly_checkin_due?: boolean
  days_since_last_checkin?: number | null
  next_checkin_date?: string | null
  can_compare?: boolean
}

export type InsightSection = {
  observed_data: string
  interpretation: string
}

export type ComprehensiveInsights = {
  data_sufficiency: 'sufficient' | 'minimal' | 'insufficient'
  data_counts: {
    mindlog_count: number
    chat_messages_count: number
    intake_answers_count: number
  }
  primary_emotion: string
  emotion_distribution: Record<string, number>
  sections: {
    overall_patterns?: InsightSection
    mood_trends?: InsightSection
    recurring_themes?: InsightSection
    stressors?: InsightSection
    strengths?: InsightSection
    conversation_patterns?: InsightSection
    mindlog_observations?: InsightSection
    intake_context?: InsightSection
    self_care_suggestions?: string[]
  }
  generated_at?: string
  non_diagnostic_notice?: string
}

export const services = {
  // Authentication
  getMe: () =>
    apiRequest<{
      uid: string
      email: string | null
      display_name: string
      is_anonymous: boolean
    }>('/api/auth/me'),
  testDb: () =>
    apiRequest<{
      uid: string
      database: string
    }>('/api/auth/db-test'),

  // Chat
  sendChat: (message: string, language: string, sessionId?: string) =>
    apiRequest<{
      reply: string
      session_id: string
      crisis_detected?: boolean
      crisis_mode?: 'none' | 'personal' | 'third_party'
      response_type?: string
      helplines?: Array<{ name: string; phone?: string; number?: string; hours?: string; url?: string }>
      safety_message?: string | null
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, language, session_id: sessionId || null }),
    }),
  listChatSessions: () =>
    apiRequest<Array<ChatSession>>('/api/chat/sessions'),
  getChatStats: () =>
    apiRequest<{ total_conversations: number; total_user_messages: number }>('/api/chat/stats'),
  createChatSession: () =>
    apiRequest<{ session_id: string }>('/api/chat/new', { method: 'POST' }),
  getChatHistory: (sessionId: string) =>
    apiRequest<Array<ChatMessage>>(
      `/api/chat/${encodeURIComponent(sessionId)}`
    ),
  deleteChatSession: (sessionId: string) =>
    apiRequest<void>(`/api/chat/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),

  // Voice Live Session
  startVoiceSession: (language = 'en') =>
    apiRequest<{
      session_id: string
      token: string
      model: string
      expires_at: string
      session_token?: string
    }>('/api/voice/session', {
      method: 'POST',
      body: JSON.stringify({ language }),
    }),
  endVoiceSession: (sessionId: string) =>
    apiRequest<void>('/api/voice/session/end', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),
  saveVoiceTranscript: (
    sessionId: string,
    turns: Array<{ role: 'user' | 'assistant'; text: string }>
  ) =>
    apiRequest<{
      saved: number
      crisis_detected: boolean
      safety_message: string | null
      helplines: Array<{ name: string; phone: string; url?: string }>
    }>(`/api/voice/session/${encodeURIComponent(sessionId)}/transcript`, {
      method: 'POST',
      body: JSON.stringify({ turns }),
    }),

  // Guided Intake
  getIntakeStatus: () =>
    apiRequest<IntakeUserStatus>('/api/intake/user-status'),

  retakeIntake: () =>
    apiRequest<any>('/api/intake/retake', { method: 'POST' }),

  getIntakeHistory: () =>
    apiRequest<Array<{
      session_id: string
      version: number
      completed_at: string | null
      summary: string
      assessment_report?: any
    }>>('/api/intake/history'),

  getIntakeAssessment: (sessionId: string) =>
    apiRequest<any>(`/api/intake/assessments/${encodeURIComponent(sessionId)}`),

  getIntakeComparison: (currentId?: string, previousId?: string) => {
    const qs = new URLSearchParams()
    if (currentId) qs.set('current_id', currentId)
    if (previousId) qs.set('previous_id', previousId)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return apiRequest<any>(`/api/intake/compare${suffix}`)
  },

  getCurrentIntakeQuestion: async (userId: string): Promise<IntakeQuestion> => {
    try {
      const state = await apiRequest<{
        session_id: string
        status: string
        current_question?: {
          question_id: string
          section?: string
          question: string
          followup_question?: string | null
        } | null
        progress?: {
          completed_questions: number
          total_questions: number
          completion_percentage: number
        }
      }>('/api/intake/start', { method: 'POST' })

      if (state?.session_id) {
        activeIntakeSessionId = state.session_id
        if (typeof window !== 'undefined') {
          localStorage.setItem('sunnobuddy_intake_session_id', state.session_id)
        }
      }

      if (state.status === 'completed' || !state.current_question) {
        return {
          question: '',
          completed: true,
          completed_questions: state.progress?.completed_questions ?? 0,
          total_questions: state.progress?.total_questions ?? 0,
          completion_percentage: state.progress?.completion_percentage ?? 100,
        }
      }

      return {
        question: state.current_question.followup_question || state.current_question.question,
        question_id: state.current_question.question_id,
        completed: false,
        follow_up_required: Boolean(state.current_question.followup_question),
        follow_up_question: state.current_question.followup_question || undefined,
        completed_questions: state.progress?.completed_questions ?? 0,
        total_questions: state.progress?.total_questions ?? 0,
        completion_percentage: state.progress?.completion_percentage ?? 0,
      }
    } catch {
      // Fallback path if session start is not yet ready
      return {
        question: 'How are you feeling in this moment?',
        question_id: 'q1',
        completed: false,
        completed_questions: 0,
        total_questions: 8,
      }
    }
  },

  getNextIntakeQuestion: async (userId: string, answer: string): Promise<IntakeQuestion> => {
    let sessionId = activeIntakeSessionId
    if (!sessionId && typeof window !== 'undefined') {
      sessionId = localStorage.getItem('sunnobuddy_intake_session_id')
    }

    if (!sessionId) {
      // Initialize if needed
      const startRes = await apiRequest<{ session_id: string }>('/api/intake/start', { method: 'POST' })
      sessionId = startRes.session_id
      activeIntakeSessionId = sessionId
    }

    const state = await apiRequest<{
      session_id: string
      status: string
      current_question?: {
        question_id: string
        section?: string
        question: string
        followup_question?: string | null
      } | null
      progress?: {
        completed_questions: number
        total_questions: number
        completion_percentage: number
      }
    }>(`/api/intake/${encodeURIComponent(sessionId)}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    })

    if (state.status === 'completed' || !state.current_question) {
      return {
        question: '',
        completed: true,
        completed_questions: state.progress?.completed_questions ?? 0,
        total_questions: state.progress?.total_questions ?? 0,
        completion_percentage: state.progress?.completion_percentage ?? 100,
      }
    }

    return {
      question: state.current_question.followup_question || state.current_question.question,
      question_id: state.current_question.question_id,
      completed: false,
      follow_up_required: Boolean(state.current_question.followup_question),
      follow_up_question: state.current_question.followup_question || undefined,
      completed_questions: state.progress?.completed_questions ?? 0,
      total_questions: state.progress?.total_questions ?? 0,
      completion_percentage: state.progress?.completion_percentage ?? 0,
    }
  },

  trackIntakeProgress: async (userId: string, questionId: string, answer: string): Promise<IntakeProgress> => {
    let sessionId = activeIntakeSessionId
    if (!sessionId && typeof window !== 'undefined') {
      sessionId = localStorage.getItem('sunnobuddy_intake_session_id')
    }
    if (!sessionId) return { completed_questions: 1, total_questions: 8 }

    try {
      const prog = await apiRequest<{
        completed_questions: number
        total_questions: number
        completion_percentage: number
      }>(`/api/intake/${encodeURIComponent(sessionId)}/progress`)
      return {
        completed_questions: prog.completed_questions,
        total_questions: prog.total_questions,
        completion_percentage: prog.completion_percentage,
      }
    } catch {
      return { completed_questions: 1, total_questions: 8 }
    }
  },

  // MindLog (Journal)
  listMindLogs: async (): Promise<MindLogEntry[]> => {
    const list = await apiRequest<any[]>('/api/mindlog')
    return (list || []).map((item) => ({
      id: item.entry_id || item.id,
      title: item.title,
      content: item.content,
      date: item.entry_date || item.date,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at,
      analysis_status: item.analysis_status,
    }))
  },

  getMindLog: async (id: string): Promise<MindLogEntry> => {
    const item = await apiRequest<any>(`/api/mindlog/${encodeURIComponent(id)}`)
    return {
      id: item.entry_id || item.id,
      title: item.title,
      content: item.content,
      date: item.entry_date || item.date,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at,
      analysis_status: item.analysis_status,
    }
  },

  createMindLog: async (title: string, content: string, date: string): Promise<MindLogEntry> => {
    const res = await apiRequest<any>('/api/mindlog', {
      method: 'POST',
      body: JSON.stringify({ title, content, entry_date: date }),
    })
    return {
      id: res.entry_id || res.id,
      title,
      content,
      date,
      created_at: res.created_at || new Date().toISOString(),
      analysis_status: res.analysis_status || 'pending',
    }
  },

  updateMindLog: async (id: string, title: string, content: string, date: string): Promise<MindLogEntry> => {
    const res = await apiRequest<any>(`/api/mindlog/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ title, content, entry_date: date }),
    })
    return {
      id: res.entry_id || id,
      title: res.title || title,
      content: res.content || content,
      date: res.entry_date || date,
      created_at: res.created_at || new Date().toISOString(),
      updated_at: res.updated_at,
      analysis_status: res.analysis_status,
    }
  },

  deleteMindLog: (id: string) =>
    apiRequest<void>(`/api/mindlog/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  getMindLogCalendar: () =>
    apiRequest<string[]>('/api/mindlog/calendar'),

  // Emotions
  getMindLogEmotion: async (id: string): Promise<EmotionAnalysis> => {
    const res = await apiRequest<any>(`/api/emotions/analyze/${encodeURIComponent(id)}`, {
      method: 'POST',
    })
    return {
      primaryEmotion: res.primary_emotion || res.primaryEmotion,
      confidence: res.confidence,
      distribution: res.emotions || res.distribution,
      analyzedAt: res.analyzed_at || res.analyzedAt,
    }
  },

  getEmotionSummary: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<{
      total_entries: number
      most_frequent_emotion: string | null
      average_distribution: Record<string, number>
      trend: Array<{ date: string; emotion: string; confidence: number }>
    }>(`/api/emotions/summary${qs}`)
  },

  getEmotionTrends: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return apiRequest<
      Array<{
        date: string
        emotion: string
        confidence: number
        emotions: Record<string, number>
      }>
    >(`/api/emotions/trends${qs}`)
  },

  getComprehensiveInsights: () =>
    apiRequest<ComprehensiveInsights>('/api/emotions/comprehensive'),

  // Reports
  createMindLogReport: async (startDate: string, endDate: string): Promise<MindLogReportResponse> => {
    const reportData = await apiRequest<{ report_id: string }>('/api/reports/mindlog', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, end_date: endDate }),
    })
    // Download the generated PDF blob directly from backend
    return apiRequest<Blob>(`/api/reports/${encodeURIComponent(reportData.report_id)}/download`)
  },

  generateWellnessReport: (params: {
    period?: string
    start_date?: string
    end_date?: string
    sources?: string[]
  }) =>
    apiRequest<any>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  listReports: () =>
    apiRequest<Array<{ report_id: string; period?: string; start_date?: string; end_date?: string; created_at: string }>>('/api/reports'),

  getReport: (reportId: string) =>
    apiRequest<any>(`/api/reports/${encodeURIComponent(reportId)}`),

  downloadReport: (reportId: string) =>
    apiRequest<Blob>(`/api/reports/${encodeURIComponent(reportId)}/download`),

  deleteReport: (reportId: string) =>
    apiRequest<void>(`/api/reports/${encodeURIComponent(reportId)}`, { method: 'DELETE' }),

  // Therapist Locator
  searchTherapists: (params: { lat?: number; lon?: number; query?: string; radius_km?: number }) => {
    const qs = new URLSearchParams()
    if (params.lat !== undefined && params.lon !== undefined) {
      qs.set('lat', String(params.lat))
      qs.set('lon', String(params.lon))
    }
    if (params.query) qs.set('query', params.query)
    if (params.radius_km) qs.set('radius_km', String(params.radius_km))
    return apiRequest<{
      location: string
      radius_km: number
      radius_expanded?: boolean
      count: number
      total_providers_found?: number
      source?: string
      notice?: string
      coordinates?: { lat: number | null; lon: number | null } | null
      therapists: Array<{
        id: string
        name: string
        type: string
        specialty?: string
        address: string
        distance_km?: number
        phone?: string
        website?: string
        verified: boolean
        emergency: boolean
        actions: {
          directions_url?: string
          call_url?: string
          website_url?: string
        }
      }>
      providers?: Array<any>
      verified_directories?: Array<{
        name: string
        description?: string
        url: string
        helpline?: string
      }>
      directory_links?: Array<any>
    }>(`/api/therapists/search?${qs.toString()}`)
  },
}
