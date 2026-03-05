export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface BaseApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: ApiError;
}

export interface BlendItem {
  곡물: string;
  비율: number;
}

export interface Recommendation {
  mode: 'own_only' | 'hybrid' | 'catalog' | 'survey';
  blend: BlendItem[];
  reasons: string[];
}

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
  | 'ask_avoid_or_allergy'
  | 'complete'
  | 'surveying';

export interface SurveyState {
  health_goals: string[];
  texture_preference: '고슬밥' | '찰진밥' | '콩없는 밥' | '선호없음' | null;
  own_grains: string[];
  avoid_or_allergy: string[];
}

export interface AppState {
  conversation_stage: SurveyStage;
  survey_state: SurveyState;
}

export interface DebugLogEntry {
  step: string;
  content: unknown;
  prompt?: string;
  timestamp: string;
}

export interface ChatResponseData {
  message: ChatMessage;
  appState: AppState;
  isComplete: boolean;
  debugLogs?: DebugLogEntry[];
}

export interface SurveyQuestionPayload {
  target_gender: string;
  target_age: string;
  texture_pref: string;
  disease: string;
  constitution1: string;
  constitution2: string;
  expectation1: string;
  expectation2: string;
  avoid_grains: string[];
  frequency: string;
}

export interface SurveySubmitData extends Recommendation {}

export interface RecipeItem {
  recipeKey: string;
  recipeNo: string;
  recipeNm: string;
}

export interface CookingState {
  ingredient: string | null;
  purpose: string | null;
  texture: string | null;
  specific_menu: string | null;
}

export interface CookingAppState {
  conversation_stage: 'start' | 'ask_clarification' | 'complete';
  cooking_state: CookingState;
  recipe_list: RecipeItem[];
  selected_menu?: RecipeItem;
}

export interface CookingMessage {
  role: 'user' | 'bot';
  content: string;
}

export interface CookCommand {
  recipeKey: string;
  recipeNo: string;
  recipeNm: string;
}

export interface CookingAnalyzeData {
  message: {
    role: 'bot';
    content: string;
    cook_command?: CookCommand;
  };
  isComplete: boolean;
  appState: Partial<CookingAppState>;
  debugLogs?: DebugLogEntry[];
}

export interface SttData {
  text: string;
}

export interface ImageAnalyzeResult {
  label: string;
  score: number;
}

export interface CuchenSaveResultPayload {
  type: 'survey' | 'chat';
  mode?: string;
  blend?: BlendItem[];
  reasons?: string[];
}
