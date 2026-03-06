import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@lucasexpresso.com'
    const password = await bcrypt.hash('123456', 10)

    const admin = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            password,
            displayName: 'Administrador Lucas',
            role: 'admin',
        },
    })

    const client = await prisma.user.upsert({
        where: { email: 'cliente@lucasexpresso.com' },
        update: {},
        create: {
            email: 'cliente@lucasexpresso.com',
            password,
            displayName: 'Cliente Teste',
            role: 'client',
        },
    })

    const courier = await prisma.user.upsert({
        where: { email: 'motoboy@lucasexpresso.com' },
        update: {},
        create: {
            email: 'motoboy@lucasexpresso.com',
            password,
            displayName: 'Motoboy Teste',
            role: 'courier',
            status: 'online'
        },
    })

    console.log('✅ Banco de dados Povoado com sucesso!')
    console.log('--- Credenciais de Acesso (Senha padrão para todos: 123456) ---')
    console.log('👮 Admin:  admin@lucasexpresso.com')
    console.log('🧍 Cliente: cliente@lucasexpresso.com')
    console.log('🛵 Motoboy: motoboy@lucasexpresso.com')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
