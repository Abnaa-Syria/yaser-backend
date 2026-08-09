import fs from 'fs';
import path from 'path';
import { sanitizeLegacyText } from './mappers.js';
import { inferTablePrefix, iterateInsertTuples, slugify } from './sql-parse.js';

export type ParsedLegacyCourse = {
  legacyId: string;
  title: string;
  slug: string;
  status: string;
  contentHtml: string;
  shortDescription: string;
};

export type ParsedLegacyLesson = {
  legacyId: string;
  title: string;
  slug: string;
  status: string;
  contentHtml: string;
  vdoCipherVideoId: string | null;
  videoUrl: string | null;
  durationLabel: string | null;
};

export type ParsedCurriculumSection = {
  legacyId: string;
  title: string;
  courseLegacyId: string;
  order: number;
};

export type ParsedCurriculumMaterial = {
  legacyId: string;
  postLegacyId: string;
  postType: string;
  sectionLegacyId: string;
  order: number;
};

export type CourseImportPlan = {
  filePath: string;
  courses: ParsedLegacyCourse[];
  lessonsById: Map<string, ParsedLegacyLesson>;
  sections: ParsedCurriculumSection[];
  materials: ParsedCurriculumMaterial[];
  lessonMaterials: ParsedCurriculumMaterial[];
  quizMaterialsSkipped: number;
  orphanMaterials: number;
  coursesWithoutCurriculum: string[];
  sectionCountByCourse: Record<string, number>;
  lessonCountByCourse: Record<string, number>;
};

const LESSON_META_KEYS = new Set(['vdocipher_id', 'lesson_youtube_url', 'duration', 'video_type']);

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function extractVdoCipherId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = String(raw).match(/\[vdo\s+id=["']?([a-f0-9]+)["']?\s*\]/i) || String(raw).match(/\b([a-f0-9]{32})\b/i);
  return match?.[1] || null;
}

function mapPublishStatus(wpStatus: string): 'PUBLISHED' | 'DRAFT' {
  return wpStatus === 'publish' ? 'PUBLISHED' : 'DRAFT';
}

export function wpStatusToApp(wpStatus: string) {
  return mapPublishStatus(wpStatus);
}

export function buildCourseImportPlan(filePath: string): CourseImportPlan {
  const absolutePath = path.resolve(filePath);
  const sql = fs.readFileSync(absolutePath, 'utf8');
  const prefix = inferTablePrefix(sql);

  const courses: ParsedLegacyCourse[] = [];
  const lessonsById = new Map<string, ParsedLegacyLesson>();
  const courseIds = new Set<string>();
  const lessonIds = new Set<string>();

  for (const row of iterateInsertTuples(sql, `${prefix}posts`)) {
    if (row.length < 21) continue;
    const postType = String(row[20] || '');
    if (postType !== 'stm-courses' && postType !== 'stm-lessons') continue;

    const legacyId = String(row[0]);
    const title = decodeHtmlEntities(String(row[5] || '')).trim() || `Untitled ${legacyId}`;
    const slug = slugify(String(row[11] || title), `legacy-${legacyId}`);
    const status = String(row[7] || 'draft');
    const contentHtml = String(row[4] || '');
    const shortDescription = sanitizeLegacyText(contentHtml).slice(0, 400);

    if (postType === 'stm-courses') {
      courseIds.add(legacyId);
      courses.push({
        legacyId,
        title: sanitizeLegacyText(title).slice(0, 200) || `Course ${legacyId}`,
        slug,
        status,
        contentHtml,
        shortDescription,
      });
    } else {
      lessonIds.add(legacyId);
      lessonsById.set(legacyId, {
        legacyId,
        title: sanitizeLegacyText(title).slice(0, 200) || `Lesson ${legacyId}`,
        slug,
        status,
        contentHtml,
        vdoCipherVideoId: null,
        videoUrl: null,
        durationLabel: null,
      });
    }
  }

  // Curriculum
  const sections: ParsedCurriculumSection[] = [];
  for (const row of iterateInsertTuples(sql, `${prefix}stm_lms_curriculum_sections`)) {
    if (row.length < 4) continue;
    sections.push({
      legacyId: String(row[0]),
      title: sanitizeLegacyText(decodeHtmlEntities(String(row[1] || ''))).slice(0, 200) || `Section ${row[0]}`,
      courseLegacyId: String(row[2]),
      order: Number(row[3]) || 0,
    });
  }

  const materials: ParsedCurriculumMaterial[] = [];
  for (const row of iterateInsertTuples(sql, `${prefix}stm_lms_curriculum_materials`)) {
    if (row.length < 5) continue;
    materials.push({
      legacyId: String(row[0]),
      postLegacyId: String(row[1]),
      postType: String(row[2] || ''),
      sectionLegacyId: String(row[3]),
      order: Number(row[4]) || 0,
    });
  }

  const sectionIds = new Set(sections.map((s) => s.legacyId));
  const lessonMaterials = materials.filter((m) => m.postType === 'stm-lessons');
  const quizMaterialsSkipped = materials.filter((m) => m.postType === 'stm-quizzes').length;
  const orphanMaterials = lessonMaterials.filter((m) => !sectionIds.has(m.sectionLegacyId)).length;

  // Lesson meta (video)
  for (const row of iterateInsertTuples(sql, `${prefix}postmeta`)) {
    if (row.length < 4) continue;
    const postId = String(row[1]);
    const key = String(row[2] || '');
    if (!lessonIds.has(postId) || !LESSON_META_KEYS.has(key)) continue;
    const lesson = lessonsById.get(postId);
    if (!lesson) continue;
    const value = row[3];
    if (key === 'vdocipher_id') {
      lesson.vdoCipherVideoId = extractVdoCipherId(value);
    } else if (key === 'lesson_youtube_url' && value) {
      lesson.videoUrl = String(value).trim() || lesson.videoUrl;
    } else if (key === 'duration' && value) {
      lesson.durationLabel = String(value).trim() || null;
    }
  }

  // Prefer VdoCipher in content shortcode if meta missing
  for (const lesson of lessonsById.values()) {
    if (!lesson.vdoCipherVideoId) {
      lesson.vdoCipherVideoId = extractVdoCipherId(lesson.contentHtml);
    }
  }

  const sectionCountByCourse: Record<string, number> = {};
  const lessonCountByCourse: Record<string, number> = {};
  const sectionCourse = new Map(sections.map((s) => [s.legacyId, s.courseLegacyId]));
  for (const section of sections) {
    sectionCountByCourse[section.courseLegacyId] = (sectionCountByCourse[section.courseLegacyId] || 0) + 1;
  }
  for (const material of lessonMaterials) {
    const courseId = sectionCourse.get(material.sectionLegacyId);
    if (!courseId) continue;
    lessonCountByCourse[courseId] = (lessonCountByCourse[courseId] || 0) + 1;
  }

  const coursesWithSections = new Set(sections.map((s) => s.courseLegacyId));
  const coursesWithoutCurriculum = courses
    .filter((c) => !coursesWithSections.has(c.legacyId))
    .map((c) => c.legacyId);

  courses.sort((a, b) => Number(a.legacyId) - Number(b.legacyId));

  return {
    filePath: absolutePath,
    courses,
    lessonsById,
    sections,
    materials,
    lessonMaterials,
    quizMaterialsSkipped,
    orphanMaterials,
    coursesWithoutCurriculum,
    sectionCountByCourse,
    lessonCountByCourse,
  };
}
