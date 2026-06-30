import { create, insert, search, type Orama } from "@orama/orama";

let oramaDb: Orama<any> | null = null;

export async function getSearchIndex() {
  if (oramaDb) return oramaDb;
  
  oramaDb = await create({
    schema: {
      title: "string",
      content: "string",
      courseId: "string",
      lessonId: "string",
    },
  });
  
  return oramaDb;
}

export async function indexCourseLesson(orama: Orama<any>, data: { title: string; content: string; courseId: string; lessonId: string }) {
  await insert(orama, data);
}

export async function searchIndex(orama: Orama<any>, query: string) {
  return await search(orama, { term: query });
}
