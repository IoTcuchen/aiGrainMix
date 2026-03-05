import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log("[NextJS Proxy] Sending to Python Server (/api/cooking/analyze): payload size", JSON.stringify(body).length);

        // Python 백엔드로 명시적 프록시
        const pythonUrl = process.env.LEGACY_API_URL || 'http://127.0.0.1:8000';
        const res = await fetch(`${pythonUrl}/api/cooking/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("[NextJS Proxy] Python Server Error:", res.status, errText);
            return NextResponse.json({ error: "Python API Error", details: errText }, { status: res.status });
        }

        const data = await res.json();
        console.log("[NextJS Proxy] Python Server Response OK.");
        return NextResponse.json(data);

    } catch (err: any) {
        console.error("[NextJS Proxy] Fetch to Python failed:", err.message);
        return NextResponse.json({ error: "Proxy connection failed", details: err.message }, { status: 500 });
    }
}
