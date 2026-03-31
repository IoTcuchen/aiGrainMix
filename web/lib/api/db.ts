import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

/**
 * 관리자 DB 싱글톤 커넥션 풀.
 * 모듈이 최초 import될 때 한 번만 풀을 생성하고, 이후 요청은 모두 공유합니다.
 * Vercel Serverless에서도 동일 인스턴스를 재사용하므로 연결 오버헤드가 최소화됩니다.
 */
export function getMgrPool(): mysql.Pool {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.MGR_DB_HOST || process.env.DB_HOST,
            user: process.env.MGR_DB_USER || process.env.DB_USER,
            password: process.env.MGR_DB_PASSWORD || process.env.DB_PASSWORD,
            database: process.env.MGR_DB_NAME || process.env.DB_NAME,
            port:
                Number(process.env.MGR_DB_PORT) ||
                (process.env.MGR_DB_HOST === '127.0.0.1' ? 33306 : Number(process.env.DB_PORT) || 3306),
            connectionLimit: 10,
            waitForConnections: true,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        });
    }
    return pool;
}
