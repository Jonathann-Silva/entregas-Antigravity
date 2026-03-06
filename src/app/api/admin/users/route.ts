import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';

// GET all users (except the admin requesting)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            where: {
                id: { not: session.user.id }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Map id to uid for frontend compatibility until full migration
        const mappedUsers = users.map(u => ({ ...u, uid: u.id }));

        return NextResponse.json(mappedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST create a new user (Client or Courier)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { email, password, displayName, role, userType, status, address } = data;

        if (!email || !password || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Email já está em uso' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                displayName,
                role,
                userType,
                status: status || 'online',
                address,
                // Default rates
                deliveryRate: 0,
                condoRateGoldemItalian: 0,
                condoRateMonteRey: 0,
                rateAricanduva: 0,
                rateApucarana: 0,
                rateSabaudia: 0,
                rateRolandia: 0,
                rateLondrina: 0,
            }
        });

        const { password: _, ...userWithoutPassword } = newUser;
        return NextResponse.json({ ...userWithoutPassword, uid: newUser.id }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
