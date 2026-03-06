import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user as any).role !== 'courier') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lat, lng } = await request.json();

        if (typeof lat !== 'number' || typeof lng !== 'number') {
            return NextResponse.json({ error: 'Invalid location data' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                lastLocationLat: lat,
                lastLocationLng: lng,
                lastLocationUpdatedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating courier location:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
