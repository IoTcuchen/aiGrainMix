import { NextResponse } from 'next/server';
import { getCacheList, deleteCacheById } from '@/lib/db/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const list = getCacheList();
        return NextResponse.json(list);
    } catch (error) {
        console.error('Cache GET error:', error);
        return NextResponse.json({ error: 'Failed to get cache list' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        deleteCacheById(Number(id));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cache DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete cache' }, { status: 500 });
    }
}
