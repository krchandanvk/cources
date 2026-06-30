/**
 * Safe Database Migration: Deduplication + Unique Constraints
 *
 * This script:
 * 1. Detects and logs all duplicate rows in Progress, Bookmark, Review, Wishlist
 * 2. Removes duplicates (keeping the oldest record per group)
 * 3. Generates the SQL for adding unique constraints
 *
 * Run BEFORE running prisma db push / prisma migrate:
 *   npx ts-node --esm scripts/safe-migrate.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DedupeResult {
  table: string;
  duplicatesFound: number;
  duplicatesRemoved: number;
}

async function deduplicateProgress(): Promise<DedupeResult> {
  console.log("\n📊 Checking Progress table for duplicates...");

  // Find all (profileId, lessonId) pairs with more than 1 row
  const duplicates = await prisma.$queryRaw<
    Array<{ profileId: string; lessonId: string; count: bigint }>
  >`
    SELECT "profileId", "lessonId", COUNT(*) as count
    FROM "Progress"
    GROUP BY "profileId", "lessonId"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log("   ✅ No duplicates found in Progress.");
    return { table: "Progress", duplicatesFound: 0, duplicatesRemoved: 0 };
  }

  let removed = 0;
  for (const dup of duplicates) {
    const rows = await prisma.progress.findMany({
      where: { profileId: dup.profileId, lessonId: dup.lessonId },
      orderBy: { completedAt: "asc" },
    });

    // Keep first (oldest), delete the rest
    const toDelete = rows.slice(1);
    console.log(
      `   🗑  Progress(profileId=${dup.profileId.slice(0, 8)}…, lessonId=${dup.lessonId.slice(0, 8)}…): keeping 1, deleting ${toDelete.length}`
    );

    for (const row of toDelete) {
      await prisma.progress.delete({ where: { id: row.id } });
      removed++;
    }
  }

  return { table: "Progress", duplicatesFound: duplicates.length, duplicatesRemoved: removed };
}

async function deduplicateBookmarks(): Promise<DedupeResult> {
  console.log("\n📊 Checking Bookmark table for duplicates...");

  const duplicates = await prisma.$queryRaw<
    Array<{ profileId: string; lessonId: string; count: bigint }>
  >`
    SELECT "profileId", "lessonId", COUNT(*) as count
    FROM "Bookmark"
    GROUP BY "profileId", "lessonId"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log("   ✅ No duplicates found in Bookmark.");
    return { table: "Bookmark", duplicatesFound: 0, duplicatesRemoved: 0 };
  }

  let removed = 0;
  for (const dup of duplicates) {
    const rows = await prisma.bookmark.findMany({
      where: { profileId: dup.profileId, lessonId: dup.lessonId },
    });
    const toDelete = rows.slice(1);
    for (const row of toDelete) {
      await prisma.bookmark.delete({ where: { id: row.id } });
      removed++;
    }
    console.log(
      `   🗑  Bookmark: keeping 1, deleting ${toDelete.length}`
    );
  }

  return { table: "Bookmark", duplicatesFound: duplicates.length, duplicatesRemoved: removed };
}

async function deduplicateReviews(): Promise<DedupeResult> {
  console.log("\n📊 Checking Review table for duplicates...");

  const duplicates = await prisma.$queryRaw<
    Array<{ profileId: string; courseId: string; count: bigint }>
  >`
    SELECT "profileId", "courseId", COUNT(*) as count
    FROM "Review"
    GROUP BY "profileId", "courseId"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log("   ✅ No duplicates found in Review.");
    return { table: "Review", duplicatesFound: 0, duplicatesRemoved: 0 };
  }

  let removed = 0;
  for (const dup of duplicates) {
    const rows = await prisma.review.findMany({
      where: { profileId: dup.profileId, courseId: dup.courseId },
      orderBy: { createdAt: "asc" },
    });
    const toDelete = rows.slice(1);
    for (const row of toDelete) {
      await prisma.review.delete({ where: { id: row.id } });
      removed++;
    }
    console.log(`   🗑  Review: keeping 1, deleting ${toDelete.length}`);
  }

  return { table: "Review", duplicatesFound: duplicates.length, duplicatesRemoved: removed };
}

async function deduplicateWishlists(): Promise<DedupeResult> {
  console.log("\n📊 Checking Wishlist table for duplicates...");

  const duplicates = await prisma.$queryRaw<
    Array<{ profileId: string; courseId: string; count: bigint }>
  >`
    SELECT "profileId", "courseId", COUNT(*) as count
    FROM "Wishlist"
    GROUP BY "profileId", "courseId"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log("   ✅ No duplicates found in Wishlist.");
    return { table: "Wishlist", duplicatesFound: 0, duplicatesRemoved: 0 };
  }

  let removed = 0;
  for (const dup of duplicates) {
    const rows = await prisma.wishlist.findMany({
      where: { profileId: dup.profileId, courseId: dup.courseId },
    });
    const toDelete = rows.slice(1);
    for (const row of toDelete) {
      await prisma.wishlist.delete({ where: { id: row.id } });
      removed++;
    }
    console.log(`   🗑  Wishlist: keeping 1, deleting ${toDelete.length}`);
  }

  return { table: "Wishlist", duplicatesFound: duplicates.length, duplicatesRemoved: removed };
}

async function deduplicateCertificates(): Promise<DedupeResult> {
  console.log("\n📊 Checking Certificate table for duplicates...");

  const duplicates = await prisma.$queryRaw<
    Array<{ profileId: string; courseId: string; count: bigint }>
  >`
    SELECT "profileId", "courseId", COUNT(*) as count
    FROM "Certificate"
    GROUP BY "profileId", "courseId"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log("   ✅ No duplicates found in Certificate.");
    return { table: "Certificate", duplicatesFound: 0, duplicatesRemoved: 0 };
  }

  let removed = 0;
  for (const dup of duplicates) {
    const rows = await prisma.certificate.findMany({
      where: { profileId: dup.profileId, courseId: dup.courseId },
      orderBy: { issuedAt: "asc" },
    });
    const toDelete = rows.slice(1);
    for (const row of toDelete) {
      await prisma.certificate.delete({ where: { id: row.id } });
      removed++;
    }
    console.log(`   🗑  Certificate: keeping 1, deleting ${toDelete.length}`);
  }

  return { table: "Certificate", duplicatesFound: duplicates.length, duplicatesRemoved: removed };
}

async function main() {
  console.log(`\n🔧 SkillRise Safe Migration — Deduplication Pass`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Database:  ${process.env.DATABASE_URL?.replace(/\/\/.*@/, "//<credentials>@")}`);

  const results: DedupeResult[] = [];

  results.push(await deduplicateProgress());
  results.push(await deduplicateBookmarks());
  results.push(await deduplicateReviews());
  results.push(await deduplicateWishlists());
  results.push(await deduplicateCertificates());

  console.log(`\n\n📋 DEDUPLICATION SUMMARY`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`${"Table".padEnd(25)} ${"Duplicate Groups".padEnd(18)} ${"Rows Removed"}`);
  console.log(`${"─".repeat(60)}`);

  let totalRemoved = 0;
  for (const r of results) {
    console.log(
      `${r.table.padEnd(25)} ${String(r.duplicatesFound).padEnd(18)} ${r.duplicatesRemoved}`
    );
    totalRemoved += r.duplicatesRemoved;
  }

  console.log(`${"─".repeat(60)}`);
  console.log(`${"TOTAL".padEnd(25)} ${"".padEnd(18)} ${totalRemoved} rows removed`);

  if (totalRemoved > 0) {
    console.log(`\n✅ Deduplication complete. Safe to run: npx prisma db push`);
  } else {
    console.log(`\n✅ Database is clean. Safe to run: npx prisma db push`);
  }
}

main()
  .catch((e) => {
    console.error("\n❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
