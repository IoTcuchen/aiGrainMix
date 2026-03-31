# 그레인믹스 관리자 대시보드 - 지표별 SQL 쿼리 가이드

이 문서는 관리자 대시보드(Manager Dashboard)에 표출되는 각 통계 지표들이 **실제 데이터베이스의 어떤 테이블에서 어떤 조건(WHERE)으로 데이터를 추출하고 있는지** 설명하기 위한 문서입니다.

---

## 1. 활성 기기 및 등록 기기 상태 (기기 연결 상태)
현재 서버와 연결된 통신 모듈(기기)의 온라인/오프라인 비율을 보여주는 파이 차트 및 우측 상단 KPI 카드 통계입니다.

* **테이블:** `SC_DEVICE_STATUS` (기기 상태 테이블)
* **기준 대상:** `CONN_YN` 콜럼 (Y: 온라인, N: 오프라인)
* **SQL 쿼리:**
```sql
SELECT CONN_YN as status, COUNT(*) as count 
FROM SC_DEVICE_STATUS 
GROUP BY CONN_YN;
```
> **설명:** 현재 등록된 전체 기기의 통신 상태를 그룹화하여 조회합니다. 이 중 `'Y'` 상태인 건수들의 합을 '활성 기기(온라인)' KPI로, 전체 합계를 '총 등록 기기' 통계로 활용합니다.

---

## 2. 주간/일별 전체 취사량 트렌드 (중앙 메인 라인 차트)
보드 우측 상단 검색창에서 사용자가 지정한 기간(startDate ~ endDate) 동안 매일 얼마나 취사가 발생했는지 하루 단위 추세를 보여줍니다.

* **테이블:** `SC_DEVICE_COOK_LOG` (일별 취사 집계 로그)
* **기준 대상:** `DAY` 콜럼 (YYYYMMDD 형식의 날짜 문자열 데이터)
* **SQL 쿼리:**
```sql
SELECT DAY as dateStr, COUNT(*) as count
FROM SC_DEVICE_COOK_LOG
WHERE DAY BETWEEN ? AND ?
GROUP BY DAY
ORDER BY DAY ASC;
```
> **설명:** 파라미터로 넘어온 시작일과 종료일 범위 내의 일별 취사 건수를 날짜순으로 정렬해 추출합니다.
> **개발 포인트:** 프론트엔드 그래프 과부하를 막기 위해, 조회 기간이 21일을 초과하면 서버에서 3~4일 단위로 묶고(평균화), 60일 초과 시 알아서 '월별 단위(YYYY-MM)' 추세로 다운샘플링하여 제공하는 내부 로직이 포함되어 있습니다.

---

## 3. 오늘 당일 취사 횟수 (KPI 카드)
우측 상단 4개의 KPI 요약 카드에 들어가는 당일(Today) 전용 취사 횟수입니다.

* **테이블:** `SC_DEVICE_COOK_LOG`
* **기준 대상:** `DAY = 오늘날짜` 매칭
* **SQL 쿼리:**
```sql
SELECT COUNT(*) as count 
FROM SC_DEVICE_COOK_LOG 
WHERE DAY = '20240327'; -- (예시: 실시간 오늘 날짜 동적 바인딩)
```
> **설명:** 2번 항목과 테이블은 같으나, 서버 시간 기준 정확히 '오늘'에 발생한 로그 카운트 하나만 즉시 추출합니다.

---

## 4. 인기 취사 메뉴 랭킹 Top 10 (바 차트)
사용자들이 밥솥으로 가장 많이 돌리는 메뉴(레시피) 선호도 TOP 10을 추출합니다.

* **테이블:** `SC_COOKER_LOG` (상세 취사 로그), `SC_RECIPE` (레시피 마스터 제원)
* **기준 대상:** 기간 내 집계수가 가장 높은 `RECIPE_NM` (레시피 이름)
* **SQL 쿼리:**
```sql
SELECT sr.RECIPE_NM as name, count(sr.RECIPE_NM) as count
FROM SC_COOKER_LOG scl
INNER JOIN SC_RECIPE sr ON scl.RECIPE_KEY = sr.RECIPE_KEY
WHERE DATE(scl.REG_DT) BETWEEN ? AND ?
GROUP BY sr.RECIPE_NM
ORDER BY count DESC
LIMIT 10;
```
> **설명:** 로그 테이블의 `RECIPE_KEY`는 단순 숫자/코드이므로, 마스터 테이블과 직접 조인(INNER JOIN)하여 실제 사용자 친화적인 요리명(`RECIPE_NM`)을 가져옵니다. 빈도수(count) 기준 내림차순(DESC) 적용 후 `LIMIT 10`으로 상위 10개 레시피만 잘라옵니다.

---

## 5. 스마트 앱 제어 비율 (하단 프로그레스 바 영역)
사용자가 밥솥 본체 제어판 터치 조작으로 실행했는지(수동), 쿠첸 앱이나 AI 음성 등 원격 앱으로 명령을 내렸는지(앱 제어) 점유율을 백분율로 산출합니다.

* **테이블:** `SC_COOKER_LOG` (상세 취사 로그)
* **기준 대상:** `APP_CTRL_YN` 콜럼 (Y: 앱 제어 동작, N: 밥솥 물리 조작)
* **SQL 쿼리:**
```sql
SELECT
    COUNT(CASE WHEN APP_CTRL_YN = 'Y' THEN 1 END) AS Y_CNT,
    COUNT(CASE WHEN APP_CTRL_YN = 'N' THEN 1 END) AS N_CNT
FROM SC_COOKER_LOG
WHERE DATE(REG_DT) BETWEEN ? AND ?;
```
> **설명:** 단일 테이블에서 `CASE WHEN` 연산을 활용해, 조작 방식별 카운트를 동시에 분리/집계합니다. 이를 기반으로 화면상의 다이나믹 % 프로그레스 바가 계산(Y_CNT / (Y_CNT + N_CNT))되어 렌더링됩니다.

---

## 6. 보온 이용 시간 현황 (하단 우측 바 차트)
사용자들이 취사 후 밥을 얼마나 오랫동안 보온 상태로 두는지 특정 구간 단위로 카운트합니다.

* **테이블:** `SC_DEVICE_WARM_LOG`
* **기준 대상:** `WARM_TIME` 콜럼 (0, 1~120분, 121~360분 등 분단위 매칭)
* **SQL 쿼리:**
```sql
SELECT
    count(case when WARM_TIME = 0 then 1 end) as t0,
    count(case when WARM_TIME BETWEEN 1 and 120 then 1 end) as t2,
    count(case when WARM_TIME BETWEEN 121 and 360 then 1 end) as t6,
    count(case when WARM_TIME BETWEEN 361 and 720 then 1 end) as t12,
    count(case when WARM_TIME BETWEEN 721 and 900 then 1 end) as t15,
    count(case when WARM_TIME BETWEEN 901 and 1440 then 1 end) as t24,
    count(case when WARM_TIME > 1440 then 1 end) as t36
FROM SC_DEVICE_WARM_LOG
WHERE DATE(REG_DT) BETWEEN ? AND ?;
```
> **설명:** 백엔드에서 밥솥 보온 경과 시간(분) 구획을 사용용도에 맞게 설정하여 `CASE WHEN`으로 각 구간(보온안함, 1~2시간, 2~6시간, 6~12시간, 12~15시간, 15~24시간, 24시간 이상)에 속하는 횟수(count)를 산출하여 통계냅니다.

---

## 7. 예약 설정 시간대 현황 (하단 선 차트)
사용자들이 밥솥의 '예약 취사' 기능(밥이 완성되길 희망하는 시간)을 주로 몇 시(0시~23시)로 맞춰두는지 빈도수를 분석합니다.

* **테이블:** `SC_DEVICE_RESV_TIME`
* **기준 대상:** `RESV_TIME` 콜럼 (예약 설정 시각 문자열의 앞 2자리)
* **SQL 쿼리:**
```sql
SELECT 
    LEFT(RESV_TIME, 2) as hourStr, 
    COUNT(*) as count
FROM SC_DEVICE_RESV_TIME
WHERE DATE(REG_DT) BETWEEN ? AND ?
GROUP BY hourStr
ORDER BY hourStr ASC;
```
> **설명:** `RESV_TIME` 문자열(예: '0730', '1800')에서 `LEFT()` 함수를 사용해 앞의 2글자(시간)만 추출하여 그룹화합니다. 이를 통해 소비자가 아침 식사를 위해 예약하는지 저녁을 위해 예약하는지 라이프스타일을 파악할 수 있습니다.
하루 일과 중 사용자들이 어떤 시간대에 가장 많은 취사를 실행하는지, 고객의 라이프스타일 패턴 빈도수를 분석합니다.

* **테이블:** `SC_COOKER_LOG` 
* **기준 대상:** `REG_DT` 콜럼 (발생한 DATETIME) 내부의 'HOUR(시간)' 값
* **SQL 쿼리:**
```sql
SELECT HOUR(REG_DT) as hour, COUNT(*) as count
FROM SC_COOKER_LOG
WHERE DATE(REG_DT) BETWEEN ? AND ?
GROUP BY hour
ORDER BY hour ASC;
```
> **설명:** 데이터베이스 내장 함수인 `HOUR()`를 사용하여 날짜/시간에서 순수하게 `시` 단위(0~23)만 추출해 그룹핑합니다. 
> **개발 포인트:** 결과 값이 아예 없는 한산한 시간대의 경우, 프론트엔드 라인 차트가 끊어지는 현상을 막기 위해 백엔드에서 강제로 해당 시간에 기본값 `0`을 주입하여 가공 파싱을 거칩니다.

---

## 8. 1인가구 vs 다인가구 판별 (인분 수 분석)
사용자가 주로 몇 인분의 밥을 취사하는지 분석하여 고객 가구 행태(1인, 2인 이상 등)를 유추합니다.

* **테이블:** `SC_COOKER_LOG`
* **기준 대상:** `SERVING_CNT` (취사 인분 수)
* **SQL 쿼리:**
```sql
SELECT SERVING_CNT as servingSize, COUNT(*) as count
FROM SC_COOKER_LOG
WHERE DATE(REG_DT) BETWEEN ? AND ?
  AND SERVING_CNT > 0
GROUP BY SERVING_CNT
ORDER BY SERVING_CNT ASC
```
> **설명:** 기간 내 취사 인분 수(SERVING_CNT) 데이터를 그룹핑하여 오름차순으로 보여주며, 가장 빈도가 높은 단일 인분 수를 파악할 수 있습니다.

---

## 9. '맞춤형 밥맛' 기능 실사용률
단순 취사가 아니라 '불림(Soak)'과 '뜸(Steam)' 단계 조절 기능을 유저들이 얼마나 적극적으로 사용하는지 측정합니다.

* **테이블:** `SC_COOKER_LOG`
* **기준 대상:** `SOAK_LEVEL` (불림 단계), `STEAM_LEVEL` (뜸 단계)
* **SQL 쿼리:**
```sql
SELECT
  SUM(CASE WHEN SOAK_LEVEL > 0 THEN 1 ELSE 0 END) as soakUsed,
  SUM(CASE WHEN STEAM_LEVEL > 0 THEN 1 ELSE 0 END) as steamUsed,
  SUM(CASE WHEN SOAK_LEVEL = 0 AND STEAM_LEVEL = 0 THEN 1 ELSE 0 END) as noneUsed,
  COUNT(*) as total
FROM SC_COOKER_LOG
WHERE DATE(REG_DT) BETWEEN ? AND ?
```
> **설명:** 불림과 뜸 값이 `> 0` 인 로그를 카운트하며, 둘 다 0인 경우는 '커스텀 미사용'으로 분류하여 밥맛 조절 기능의 활용도를 백분율과 파이차트로 나타냅니다.

---

## 10. 기기 모델별 하이엔드 기능 사용 격차 (Top 10)
프리미엄 하이엔드 모델 사용자일수록 스마트 앱이나 부가 제어를 더 많이 사용하는지 모델별 점유율을 파악합니다.

* **테이블:** `SC_COOKER_LOG`, `SC_MODEL`
* **기준 대상:** `MODEL_ALIAS` (모델명), `APP_CTRL_YN` (앱 제어 여부)
* **SQL 쿼리:**
```sql
SELECT
  M.MODEL_ALIAS as modelName,
  COUNT(*) as totalCooks,
  SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
FROM SC_COOKER_LOG C
JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
WHERE DATE(C.REG_DT) BETWEEN ? AND ?
GROUP BY M.MODEL_ALIAS
ORDER BY totalCooks DESC
LIMIT 10
```
> **설명:** 전체 취사량이 많은 상위 10개 밥솥 기기 모델을 기준으로 수동 제어 비율(총량 - 앱제어량)과 앱 제어(Y) 횟수를 산출해 듀얼 바 차트로 나타냅니다.

---

## 11. 앱 온보딩 후 스마트홈 이탈률 (리텐션 추적)
밥솥 기기를 와이파이에 최초 연동(첫 사용)한 시점으로부터 몇 개월이 지난 시점까지 사용자들이 지속적으로 쿠첸 앱 제어를 이용하고 남아있는지 생존 커브(Retention)를 진단합니다.

* **테이블:** `SC_COOKER_LOG`, `SC_DEVICE_STATUS`
* **기준 대상:** 기기별 식별자 매칭 후 기기 등록일 `SC_DEVICE_STATUS.REG_DT`, 그리고 앱 제어 사용건 `APP_CTRL_YN`
* **SQL 쿼리:**
```sql
SELECT 
    TIMESTAMPDIFF(MONTH, D.REG_DT, C.REG_DT) as month_diff,
    COUNT(DISTINCT C.DEVICE_KEY) as active_devices
FROM SC_COOKER_LOG C
JOIN SC_DEVICE_STATUS D ON C.DEVICE_KEY = D.DEVICE_KEY
WHERE C.APP_CTRL_YN = 'Y'
  AND C.REG_DT >= ? AND C.REG_DT <= ?
GROUP BY month_diff
ORDER BY month_diff ASC
LIMIT 12
```
> **설명:** 기존의 `WITH` 서브쿼리를 통한 막대한 풀스캔 비용을 타개하기 위해, `SC_DEVICE_STATUS` (기기 마스터) 테이블과 조인(JOIN)하여 해당 기기의 최초 등록일(`D.REG_DT`)과 실제 취사가 일어난 로그 시점(`C.REG_DT`) 사이의 **개월 차(month_diff)**를 구합니다. 해당 개월 차에 취사 이력이 있는 고유 기기 수(`COUNT DISTINCT`)를 추적해 라인 차트로 그려냅니다.
