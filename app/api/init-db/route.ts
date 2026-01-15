
import { NextResponse } from 'next/server';
import { initDatabase } from '@/app/lib/db';

export async function GET() {
    try {
        await initDatabase();
        return NextResponse.json({ message: 'Database initialized successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
