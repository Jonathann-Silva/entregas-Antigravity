import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const session = await auth();
        // Use session user id if available
        const userId = session?.user?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { pushSubscription } = body;

        // We store the Web Push subscription
        await prisma.user.update({
            where: { id: userId },
            data: {
                pushSubscription: pushSubscription || null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
