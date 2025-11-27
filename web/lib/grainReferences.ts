import type { AppState } from './types';
import { getFirebaseFirestore } from './firebaseAdmin';

interface GrainReferenceDoc {
  standardName?: string;
  standardNameLower?: string;
  synonyms?: string[];
  searchTokens?: string[];
}

type GrainAliasMap = Map<string, string>;

const COLLECTION = process.env.FIREBASE_GRAIN_COLLECTION ?? 'grainReferences';
const CACHE_TTL_MS = Number(process.env.GRAIN_REF_CACHE_TTL_MS ?? 5 * 60 * 1000);

const normalizeKey = (value: string | undefined | null): string => {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

let cache: {
  map: GrainAliasMap;
  expiresAt: number;
} | null = null;

const loadAliasMap = async (): Promise<GrainAliasMap | null> => {
  const firestore = getFirebaseFirestore();
  if (!firestore) {
    console.warn('[GrainReferences] Firestore is not initialized.');
    return null;
  }

  try {
    const snapshot = await firestore.collection(COLLECTION).get();
    const map: GrainAliasMap = new Map();

    snapshot.forEach((doc) => {
      const data = doc.data() as GrainReferenceDoc;

      if (!data?.standardName) return;
      const canonical = data.standardName.trim();
      
      const potentialAliases: (string | undefined)[] = [
        data.standardName,
        data.standardNameLower,
        ...(data.synonyms ?? []),
        ...(data.searchTokens ?? []),
      ];

      const aliases = new Set<string>(potentialAliases.filter((alias): alias is string => Boolean(alias)));

      aliases.forEach((alias) => {
        const key = normalizeKey(alias);
        if (key) {
          map.set(key, canonical);
        }
      });
    });

    cache = {
      map,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    console.info(
      `[GrainReferences] Loaded ${map.size} entries from Firestore collection "${COLLECTION}".`,
    );

    return map;
  } catch (error) {
    console.error('[GrainReferences] Failed to load Firestore documents:', error);
    return null;
  }
};

const getAliasMap = async (): Promise<GrainAliasMap | null> => {
  if (cache && cache.expiresAt > Date.now()) {
    // console.info('[GrainReferences] Using cached grain reference map.');
    return cache.map;
  }
  return loadAliasMap();
};

type NormalizeResult = {
  values: string[];
  unknown: string[];
};

const normalizeList = async (items: string[] | undefined): Promise<NormalizeResult> => {
  if (!items || items.length === 0) {
    return { values: [], unknown: [] };
  }
  const map = await getAliasMap();

  if (!map) {
    const sanitized = Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
    return { values: sanitized, unknown: [] };
  }

  const result = new Set<string>();
  const unknown: string[] = [];
  items.forEach((item) => {
    const key = normalizeKey(item);
    if (!key) return;
    const canonical = map.get(key);
    if (canonical) {
      result.add(canonical);
    } else {
      unknown.push(item.trim());
    }
  });

  return { values: Array.from(result), unknown };
};

export const normalizeGrainFields = async (
  state: AppState,
): Promise<{ normalizedState: AppState, unknownGrains: { unknownAvoid: string[]; unknownOwn: string[] } }> => {
  const { survey_state } = state;
  const avoidNormalized = await normalizeList(survey_state.avoid_or_allergy);
  const ownNormalized = await normalizeList(survey_state.own_grains);
  
  const normalizedState: AppState = {
      ...state,
      survey_state: {
          ...survey_state,
          avoid_or_allergy: avoidNormalized.values,
          own_grains: ownNormalized.values,
      }
  };

  return {
    normalizedState,
    unknownGrains: {
      unknownAvoid: avoidNormalized.unknown,
      unknownOwn: ownNormalized.unknown,
    }
  };
};
