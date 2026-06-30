/**
 * SkillRise Admin Promotion Script
 *
 * Usage:
 *   npx ts-node --esm scripts/admin-promote.ts <email>
 *   or via npm script:
 *   npm run admin:promote -- user@example.com
 *
 * This script directly updates the database. It must be run by a developer
 * with direct database access. Users can NEVER become admin through signup.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function promoteToAdmin(email: string) {
  if (!email || !email.includes("@")) {
    console.error("❌ Invalid email address provided.");
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  console.log(`\n🔐 SkillRise Admin Promotion Tool`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Target: ${normalizedEmail}`);

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, role: true },
    });

    if (!existing) {
      console.error(`\n❌ User "${normalizedEmail}" not found in the database.`);
      console.error(`   The user must register first before being promoted.`);
      process.exit(1);
    }

    if (existing.role === "ADMIN") {
      console.log(`\n⚠️  User "${normalizedEmail}" is already an ADMIN. No changes made.`);
      process.exit(0);
    }

    const updated = await prisma.user.update({
      where: { email: normalizedEmail },
      data: { role: "ADMIN" },
      select: { email: true, role: true, updatedAt: true },
    });

    console.log(`\n✅ SUCCESS: Admin role granted.`);
    console.log(`   Email:   ${updated.email}`);
    console.log(`   Role:    ${updated.role}`);
    console.log(`   At:      ${updated.updatedAt.toISOString()}`);
    console.log(`\n⚠️  Action logged. Store this confirmation for audit records.\n`);
  } catch (error) {
    console.error("\n❌ Database error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse CLI argument
const targetEmail = process.argv[2];

if (!targetEmail) {
  console.error("\n❌ Usage: npm run admin:promote -- <email>");
  console.error("   Example: npm run admin:promote -- admin@example.com\n");
  process.exit(1);
}

promoteToAdmin(targetEmail);
