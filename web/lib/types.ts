// lib/types.ts

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  quick_replies?: string[];
  recommendation?: Recommendation; 
}

export type SurveyStage =
  | 'start'
  | 'ask_health_goals'
  | 'ask_texture_preference'
  | 'ask_own_grains'
  | 'ask_avoid_or_allergy' // Added for clarity
  | 'complete';

export interface SurveyState {
  health_goals: string[];
  texture_preference: '부드러움' | '쫀득함' | '혼합된' | null;
  own_grains: string[];
  avoid_or_allergy: string[]; // Re-added this field
}

export interface AppState {
  conversation_stage: SurveyStage;
  survey_state: SurveyState;
}

// Response from the new unified /api/chat endpoint
export interface ChatApiResponse {
    message: ChatMessage;
    appState: AppState;
    isComplete: boolean;
    debugLogs?: DebugLogEntry[];
}

// FIX: Add missing ExtractorResponse type definition.
export interface ExtractorResponse {
  appState: AppState;
  missing_slots: string[];
}

export interface BlendItem {
  곡물: string;
  비율: number;
}

export interface Recommendation {
  mode: 'own_only' | 'hybrid' | 'catalog';
  blend: BlendItem[];
  reasons: string[];
}

export interface RecommendationResponse {
  recommendation: Recommendation;
}

export interface DebugLogEntry {
  step: string;
  content: any;
  prompt?: string;
  timestamp: string;
}