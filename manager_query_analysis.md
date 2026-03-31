# 관리자 대시보드 쿼리 성능 분석 & 개선 방안

> **분석 일시**: 2026-03-31  
> **대상 파일**: `web/app/api/manager/metrics/route.ts`  
> **DB 인덱스 정보**: `web/index_info.json`, `web/explain_output.txt`

---

## 📌 요약 (TL;DR)

| 심각도 | 문제 | 영향 |
|--------|------|------|
| 🔴 **치명** | `SC_COOKER_LOG` 풀스캔 (1.55M 행) | RDS CPU 급등, 모든 탭 응답 느림 |
| 🔴 **치명** | 요청마다 DB 커넥션 풀 생성/종료 | 연결 오버헤드 폭발, IOPS 낭비 |
| 🟠 **심각** | `tab=smart` 쿼리 중복 (overview·usage와 동일 쿼리 3개 반복) | 불필요한 DB 부하 3배 |
| 🟠 **심각** | `WHERE DATE(REG_DT) BETWEEN ?` → 함수 래핑으로 인덱스 무력화 | `idx_reg_dt` 사용 불가 |
| 🟡 **경고** | `SC_DEVICE_COOK_LOG`에 `DAY` 컬럼 인덱스 없음 | overview BETWEEN 전체 스캔 |
| 🟡 **경고** | `SC_COOKER_LOG`에 복합 인덱스 없음 | JOIN·GROUPBY 쿼리 filesort 발생 |

---

## 1. 스마트 제어 분석 탭 (`tab=smart`) - 가장 느린 원인

### 1-1. 현재 쿼리 구조

`tab=smart`는 3개의 쿼리를 병렬(`Promise.all`) 실행합니다:

```sql
-- ① 앱 제어 비율 (SC_COOKER_LOG 풀스캔)
SELECT COUNT(CASE WHEN APP_CTRL_YN = 'Y' THEN 1 END) AS Y_CNT,
       COUNT(CASE WHEN APP_CTRL_YN = 'N' THEN 1 END) AS N_CNT
FROM SC_COOKER_LOG
WHERE REG_DT >= ? AND REG_DT <= ?;

-- ② 예약 취사 시간대 (SC_DEVICE_RESV_TIME, REG_DT 스캔)
SELECT LEFT(RESV_TIME, 2) as hourStr, COUNT(*) as count
FROM SC_DEVICE_RESV_TIME
WHERE REG_DT >= ? AND REG_DT <= ?
GROUP BY hourStr ORDER BY hourStr ASC;

-- ③ 모델별 앱 제어 비율 (SC_COOKER_LOG + SC_MODEL JOIN, 풀스캔)
SELECT M.MODEL_NM as modelName, COUNT(*) as totalCooks,
       SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
FROM SC_COOKER_LOG C
JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
WHERE C.REG_DT >= ? AND C.REG_DT <= ?
GROUP BY M.MODEL_NM ORDER BY totalCooks DESC LIMIT 10;
```

### 1-2. EXPLAIN 분석 결과

```
쿼리 ①③: type=ALL, rows=1,552,896, Extra="Using where; Using temporary; Using filesort"
```

**→ 155만 행 전체 풀스캔 + 임시 테이블 생성 + 파일소트 발생**.  
`idx_reg_dt` 인덱스가 존재하지만 **단일 컬럼 인덱스**라서 GROUP BY·JOIN 이후의 추가 컬럼(`APP_CTRL_YN`, `MODEL_KEY`) 접근 시 **인덱스를 타도 covering index가 안 되어** 결국 행 fetch 비용이 매우 큼.

### 1-3. 중복 실행 문제

`tab=smart`의 쿼리 ①은 `tab=overview`·`tab=usage`에서도 동일하게 실행됩니다.  
**탭을 이동할 때마다 같은 쿼리가 중복 실행**되며, 5분 인-메모리 캐시가 있지만 `cacheKey`가 `tab` 단위로 분리되어 **탭 간 캐시 공유가 전혀 안 됨**.

---

## 2. 공통 문제 상세

### 2-1. 요청마다 DB 풀 생성

```typescript
// ❌ 현재 - GET 요청마다 pool 생성 후 finally에서 pool.end()
pool = mysql.createPool({ connectionLimit: 15, ... });
// ... 쿼리 실행 ...
await pool.end(); // 연결 반납
```

**문제**: `createPool()` + `pool.end()`를 매 API 호출마다 반복하면  
- TCP 핸드셰이크 비용이 매번 발생  
- RDS는 연결 수립/해제 자체도 CPU를 소비  
- 동시 요청이 몰리면 연결 큐 대기 → 타임아웃

### 2-2. `DATE()` 함수 래핑으로 인덱스 무효화

```sql
-- ❌ 기존 (manager_dashboard_metrics.md 기반 원래 설계)
WHERE DATE(REG_DT) BETWEEN ? AND ?
-- → REG_DT 컬럼에 DATE()를 감싸면 idx_reg_dt 인덱스 사용 불가 (풀스캔)
```

현재 `metrics/route.ts`에서는 대부분 `REG_DT >= ? AND REG_DT <= ?` 형식으로 **이미 부분 개선**되어 있으나,  
`SC_DEVICE_COOK_LOG`의 `DAY` 컬럼은 인덱스가 없고(PRIMARY만 존재), `overview` 탭에서 `BETWEEN`으로 전체 스캔.

### 2-3. `SC_COOKER_LOG` 복합 인덱스 부재

현재 인덱스: `idx_reg_dt (REG_DT)` 단일 컬럼만 존재

쿼리들이 실제로 접근하는 컬럼 조합:
- `REG_DT + APP_CTRL_YN` (스마트 탭 ①)
- `REG_DT + MODEL_KEY` (스마트 탭 ③, overview 모델 성능)
- `REG_DT + RECIPE_KEY` (usage 탭 인기 메뉴)
- `REG_DT + SOAK_LEVEL + STEAM_LEVEL` (usage 탭 맞춤밥)

→ 단일 인덱스로는 커버링이 안 되어 매번 **heap fetch(레코드 직접 접근) 발생**.

### 2-4. `models` 탭 - 3중 JOIN + 미집계 servingRows

```sql
-- ❌ 현재 models 탭 servingRows
SELECT M.MODEL_NM, menu, C.SERVING_CNT, COUNT(*) as count
FROM SC_COOKER_LOG C
JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
JOIN SC_RECIPE sr ON C.RECIPE_KEY = sr.RECIPE_KEY
WHERE C.REG_DT >= ? AND C.REG_DT <= ? AND C.SERVING_CNT >= 0
GROUP BY M.MODEL_NM, menu, C.SERVING_CNT
```

`GROUP BY` 3개 컬럼 조합으로 **카테시안 폭발적** 결과 집합이 생성되며,  
`SC_COOKER_LOG` 풀스캔 + `SC_MODEL` + `SC_RECIPE` 3중 조인.

### 2-5. `insights` 탭 - TIMESTAMPDIFF 연산 + 서브쿼리식 순차 실행

```sql
-- ❌ 리텐션 쿼리 - EXPLAIN: type=ALL rows=1,552,896
SELECT TIMESTAMPDIFF(MONTH, D.REG_DT, C.REG_DT) as month_diff,
       COUNT(DISTINCT C.DEVICE_KEY) as active_devices
FROM SC_COOKER_LOG C
JOIN SC_DEVICE_STATUS D ON C.DEVICE_KEY = D.DEVICE_KEY
WHERE C.APP_CTRL_YN = 'Y'
  AND C.REG_DT >= ? AND C.REG_DT <= ?
GROUP BY month_diff
```

`COUNT(DISTINCT C.DEVICE_KEY)` + `TIMESTAMPDIFF()` 계산 + 조인이 결합되어  
**1.5M행 풀스캔 후 group by → filesort** (EXPLAIN 확인됨).

또한 `insights` 탭은 `topDeviceRow`를 먼저 구한 후 `powerUserLogs`를 **순차적(직렬)** 으로 추가 실행하는데,  
이 두 번째 쿼리가 Promise.all 밖에 있어 **전체 응답 시간이 직렬화됨**.

---

## 3. 개선 방안

### 3-1. 🔴 [최우선] 복합 인덱스 추가

```sql
-- SC_COOKER_LOG 복합 인덱스 (가장 중요)
ALTER TABLE SC_COOKER_LOG
  ADD INDEX idx_reg_dt_app_ctrl  (REG_DT, APP_CTRL_YN),
  ADD INDEX idx_reg_dt_model     (REG_DT, MODEL_KEY),
  ADD INDEX idx_reg_dt_recipe    (REG_DT, RECIPE_KEY),
  ADD INDEX idx_device_reg_app   (DEVICE_KEY, REG_DT, APP_CTRL_YN);

-- SC_DEVICE_COOK_LOG - DAY 컬럼 인덱스 추가
ALTER TABLE SC_DEVICE_COOK_LOG
  ADD INDEX idx_day (DAY);
```

> **기대 효과**: `tab=smart` 쿼리 ①③ 실행 계획이 `type=range` (인덱스 레인지 스캔)로 전환,  
> rows 추정치 1.55M → 수천~수만으로 감소 예상. CPU 70~80% 감축 가능.

### 3-2. 🔴 [최우선] DB 풀 모듈 레벨 싱글톤으로 분리

```typescript
// lib/db.ts - 모듈 레벨에서 한 번만 생성
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MGR_DB_HOST,
      user: process.env.MGR_DB_USER,
      password: process.env.MGR_DB_PASSWORD,
      database: process.env.MGR_DB_NAME,
      port: Number(process.env.MGR_DB_PORT) || 3306,
      connectionLimit: 10,       // Lambda/Serverless 환경이면 5로 줄임
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,     // 연결 유지
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}
```

```typescript
// metrics/route.ts
import { getPool } from '@/lib/db';

export async function GET(request: Request) {
  const pool = getPool(); // 생성 없이 싱글톤 반환
  // ... pool.end() 호출 제거 ...
}
```

> **주의**: Vercel Serverless Function은 인스턴스가 콜드스타트 될 수 있으므로,  
> `connectionLimit`은 5~10으로 설정하고 RDS의 `max_connections` 여유분을 확인.

### 3-3. 🟠 [중요] 탭 간 캐시 공유 (공유 캐시 키 구조)

현재 `cacheKey = "${startStr}_${endStr}_${tab}"`으로 탭 단위 분리 → 중복 DB 호출.

```typescript
// 공통 캐시 키로 쿼리별 단위 캐싱
const baseCacheKey = `${startStr}_${endStr}`;

// 예: appCtrl 비율은 smart/usage 탭 공통
const appCtrlKey = `${baseCacheKey}_appCtrl`;
if (!cache.has(appCtrlKey)) {
  const result = await pool.execute(appCtrlQuery, params);
  cache.set(appCtrlKey, { data: result, timestamp: Date.now() });
}
```

또는 더 단순하게: **tab=all 로 한 번에 모든 데이터를 받아 프론트에서 분기**.  
(단, 초기 로딩이 무거워질 수 있으므로 탭별 lazy loading과 트레이드오프 검토 필요)

### 3-4. 🟠 [중요] `insights` 탭 순차 쿼리 병렬화

```typescript
// ❌ 현재: topDevice 먼저 구하고 powerUserLogs 직렬 실행
const [topDeviceRow] = await pool.execute(topDeviceQuery, params);
const topDevice = topDeviceRow[0]?.DEVICE_KEY;
if (topDevice) {
  const [pLogs] = await pool.execute(powerUserQuery, [topDevice, ...]);
}

// ✅ 개선: topDevice 조회와 나머지 쿼리 병렬화, powerUser는 별도 API로 분리
// 또는 서브쿼리로 통합:
const powerUserQuery = `
  SELECT C.REG_DT as logTime, sr.RECIPE_NM as menu, C.APP_CTRL_YN
  FROM SC_COOKER_LOG C
  LEFT JOIN SC_RECIPE sr ON C.RECIPE_KEY = sr.RECIPE_KEY
  WHERE C.DEVICE_KEY = (
    SELECT DEVICE_KEY FROM SC_COOKER_LOG
    WHERE REG_DT >= ? AND REG_DT <= ?
    GROUP BY DEVICE_KEY ORDER BY COUNT(*) DESC LIMIT 1
  )
  AND C.REG_DT >= ? AND C.REG_DT <= ?
  ORDER BY C.REG_DT DESC LIMIT 30
`;
```

### 3-5. 🟡 [권장] `models` 탭 servingRows 쿼리 최적화

```sql
-- ✅ 개선: RECIPE_KEY 조인을 CASE WHEN으로 인라인 처리 또는 별도 API로 분리
-- 무거운 3중 조인 대신, 자주 변하지 않는 SC_RECIPE는 앱 레벨 캐시로 처리
SELECT C.MODEL_KEY, C.RECIPE_KEY, C.SERVING_CNT, COUNT(*) as count
FROM SC_COOKER_LOG C
WHERE C.REG_DT >= ? AND C.REG_DT <= ?
  AND C.SERVING_CNT >= 0
GROUP BY C.MODEL_KEY, C.RECIPE_KEY, C.SERVING_CNT;
-- → 조인 제거 후 앱 레벨에서 MODEL_KEY/RECIPE_KEY를 이름으로 매핑
```

### 3-6. 🟡 [권장] 캐시 TTL 및 구조 개선

```typescript
// 현재: 5분 인-메모리 캐시 (단일 인스턴스, Serverless에서는 인스턴스별로 별도)
const CACHE_TTL_MS = 5 * 60 * 1000;

// 권장: Redis 외부 캐시로 이관 (Upstash Redis - Vercel에 친화적)
// 또는: revalidate 기반 Next.js Route Segment Cache 활용
export const revalidate = 300; // 5분 ISR 캐시 (force-dynamic 제거 후)

// 만약 force-dynamic 유지해야 한다면:
// Upstash KV + @vercel/kv 사용으로 인스턴스 간 캐시 공유
```

---

## 4. 우선순위별 액션 플랜

```
[즉시 실행 - RDS CPU 직접 감소]
  ① SC_COOKER_LOG 복합 인덱스 3개 추가  ← 가장 효과 큼
  ② SC_DEVICE_COOK_LOG.DAY 인덱스 추가

[단기 - 코드 수정]
  ③ DB Pool을 모듈 싱글톤으로 분리 (lib/db.ts)
  ④ insights 탭 powerUserLogs 병렬화 or 서브쿼리 통합

[중기 - 아키텍처 개선]
  ⑤ 탭 간 공유 쿼리 캐시 키 통합
  ⑥ models 탭 servingRows 3중 조인 → 앱 레벨 매핑으로 교체
  ⑦ Redis(Upstash) 도입으로 인스턴스 간 캐시 공유
```

---

## 5. 인덱스 추가 스크립트

```sql
-- 즉시 적용 가능한 인덱스 (ONLINE DDL, 서비스 중단 없음)
ALTER TABLE SC_COOKER_LOG
  ADD INDEX idx_reg_dt_app_ctrl (REG_DT, APP_CTRL_YN),   -- smart탭 ① 커버
  ADD INDEX idx_reg_dt_model    (REG_DT, MODEL_KEY),      -- smart탭 ③ 커버
  ADD INDEX idx_reg_dt_recipe   (REG_DT, RECIPE_KEY),     -- usage 메뉴 순위 커버
  ADD INDEX idx_device_reg_app  (DEVICE_KEY, REG_DT);     -- insights powerUser 커버

ALTER TABLE SC_DEVICE_COOK_LOG
  ADD INDEX idx_day (DAY);                                -- overview 차트 커버

-- 적용 후 검증
SHOW INDEX FROM SC_COOKER_LOG;
EXPLAIN SELECT COUNT(CASE WHEN APP_CTRL_YN = 'Y' THEN 1 END) AS Y_CNT
FROM SC_COOKER_LOG
WHERE REG_DT >= '2026-01-01 00:00:00' AND REG_DT <= '2026-03-31 23:59:59';
-- 목표: type=range, key=idx_reg_dt_app_ctrl, Extra=Using index
```

---

## 6. 예상 개선 효과

| 조치 | RDS CPU | 응답 시간 |
|------|---------|-----------|
| 복합 인덱스 추가 | -60~75% | ~5초 → ~0.5초 |
| DB Pool 싱글톤 | -10~20% | 연결 오버헤드 제거 |
| 캐시 공유 개선 | -15% | 중복 쿼리 제거 |
| 합계(보수 추정) | **-70~80%** | **5초 → 0.5~1초** |

> ⚠️ RDS 인스턴스 클래스가 db.t3.medium 이하라면 인덱스 추가 후에도  
> 대용량 기간(90일+) 조회 시에는 Read Replica 분산 또는 기간 제한(최대 30일 등) 추가 권장.
