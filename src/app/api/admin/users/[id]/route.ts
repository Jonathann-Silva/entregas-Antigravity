import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

// GET single user profile
export async function GET(request: Request, context: any) {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await Reflect.get(context, 'params');
        if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 });

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json({ ...userWithoutPassword, uid: user.id });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PATCH update user details (rates, status, address, etc.)
export async function PATCH(request: Request, context: any) {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Workaround for Next.js 15 route handlers param extraction
        const { id } = await Reflect.get(context, 'params');
        if (!id) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const data = await request.json();

        // Whitelist allowed fields to update
        const updateData: any = {};
        const allowedFields = [
            'status',
            'deliveryRate', 'condoRateGoldemItalian', 'condoRateMonteRey',
            'rateAricanduva', 'rateApucarana', 'rateSabaudia', 'rateRolandia', 'rateLondrina',
            'address'
        ];

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData
        });

        const { password: _, ...userWithoutPassword } = updatedUser;
        // Map id to uid for frontend compatibility
        return NextResponse.json({ ...userWithoutPassword, uid: updatedUser.id });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
