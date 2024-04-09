import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword =
    '$argon2id$v=19$m=65536,t=3,p=4$9PMANYqPWOgECRpqhKEYRg$KiQjUiS39nDgHMqhYEIZbiaDBD1obCDTHtM47QFzXek';

  await prisma.user.create({
    data: {
      hashedPassword: hashedPassword,
      isDeleted: false,
      role: 'ADMIN',
      name: 'Admin',
      isVerified: true,
      username: 'admin',
      email: 'admin@nodeforge.site',
    },
  });

  await prisma.user.create({
    data: {
      hashedPassword: hashedPassword,
      isDeleted: false,
      role: 'USER',
      name: 'Minh',
      isVerified: true,
      username: 'psycholog1st',
      email: 'letronghoangminh@gmail.com',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
