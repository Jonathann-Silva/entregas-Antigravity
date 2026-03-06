import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { online } = await request.json();

        if (typeof online !== 'boolean') {
            return NextResponse.json({ error: 'Invalid status data' }, { status: 400 });
        }

        // Update the admin user's status
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                status: online ? 'online' : 'offline',
            },
        });

        // Update the global AppStatus singleton
        await prisma.appStatus.upsert({
            where: { id: 'singleton' },
            update: {
                adminOnline: online,
                lastUpdated: new Date(),
            },
            create: {
                id: 'singleton',
                adminOnline: online,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating admin status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
