const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable";
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["error"] });
async function main() {
    console.log("Seeding database courses and modules...");
    const manifestPath = path.join(process.cwd(), "manifest.json");
    if (!fs.existsSync(manifestPath)) {
        console.error("manifest.json not found at workspace root.");
        return;
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    const coursesList = manifest.courses || [];
    for (const courseInfo of coursesList) {
        const courseIdStr = courseInfo.course_id.toString().padStart(2, "0");
        const courseFolder = path.join(process.cwd(), "courses", `course-${courseIdStr}`);
        const dataFilePath = path.join(courseFolder, "course-data.json");
        if (!fs.existsSync(dataFilePath)) {
            console.log(`No course-data.json found for Course ${courseInfo.course_id}. Skipping seed.`);
            continue;
        }
        console.log(`Processing Course ${courseInfo.course_id}: ${courseInfo.title}`);
        const courseData = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
        const slug = courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        // Upsert course record
        const course = await prisma.course.upsert({
            where: { slug: slug },
            update: {
                title: courseData.title,
                overview: courseData.overview,
                category: courseData.category,
                level: courseData.level,
                duration: courseData.duration,
                outcome: courseData.outcome,
                price: 299.0, // standard default price
            },
            create: {
                title: courseData.title,
                slug: slug,
                overview: courseData.overview,
                category: courseData.category,
                level: courseData.level,
                duration: courseData.duration,
                outcome: courseData.outcome,
                price: 299.0,
            },
        });
        console.log(`Course upserted: ${course.title} (ID: ${course.id})`);
        // Loop through modules
        const modules = courseData.modules || [];
        for (const modData of modules) {
            // Upsert module
            // Find existing or create
            let moduleRecord = await prisma.courseModule.findFirst({
                where: {
                    courseId: course.id,
                    order: modData.week,
                },
            });
            if (!moduleRecord) {
                moduleRecord = await prisma.courseModule.create({
                    data: {
                        courseId: course.id,
                        title: modData.title,
                        order: modData.week,
                    },
                });
            }
            else {
                moduleRecord = await prisma.courseModule.update({
                    where: { id: moduleRecord.id },
                    data: { title: modData.title },
                });
            }
            // Loop through lessons
            const lessons = modData.lessons || [];
            for (const lesData of lessons) {
                const lessonSlug = `${slug}-${lesData.lesson_id}`;
                // Upsert lesson
                const lesson = await prisma.lesson.upsert({
                    where: { slug: lessonSlug },
                    update: {
                        title: lesData.title,
                        contentMdx: lesData.content,
                        code: lesData.code || null,
                        diagram: lesData.diagram || null,
                        order: 1, // default order
                    },
                    create: {
                        moduleId: moduleRecord.id,
                        title: lesData.title,
                        slug: lessonSlug,
                        contentMdx: lesData.content,
                        code: lesData.code || null,
                        diagram: lesData.diagram || null,
                        order: 1,
                    },
                });
                // Insert Quiz if exists on module
                if (lesData.quiz && lesData.quiz.length > 0) {
                    const quiz = await prisma.quiz.upsert({
                        where: { moduleId: moduleRecord.id },
                        update: {
                            title: `Week ${modData.week} Quiz`,
                            passingScore: 1,
                        },
                        create: {
                            moduleId: moduleRecord.id,
                            title: `Week ${modData.week} Quiz`,
                            passingScore: 1,
                        },
                    });
                    // Insert questions
                    for (const q of lesData.quiz) {
                        // Find if question already exists in this quiz
                        const existingQ = await prisma.question.findFirst({
                            where: { quizId: quiz.id, question: q.question },
                        });
                        if (!existingQ) {
                            await prisma.question.create({
                                data: {
                                    quizId: quiz.id,
                                    question: q.question,
                                    options: q.options,
                                    correctAnswer: q.answer,
                                    explanation: q.explanation || "No explanation.",
                                },
                            });
                        }
                    }
                }
                // Insert Assignment if exists on module
                if (lesData.assignment) {
                    await prisma.assignment.upsert({
                        where: { moduleId: moduleRecord.id },
                        update: {
                            title: lesData.assignment.title,
                            prompt: lesData.assignment.prompt,
                        },
                        create: {
                            moduleId: moduleRecord.id,
                            title: lesData.assignment.title,
                            prompt: lesData.assignment.prompt,
                        },
                    });
                }
            }
        }
    }
    console.log("Seeding process completed successfully!");
}
main()
    .catch((e) => {
    console.error("Error during seeding database:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
