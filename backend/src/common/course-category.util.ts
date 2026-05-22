import { BadRequestException } from "@nestjs/common";
import { Course, CourseCategory } from "@prisma/client";
import { normalizeLabel } from "./normalize-label.util.js";

const CATEGORY_LABELS: Record<CourseCategory, string> = {
  [CourseCategory.SOLO]: "Solo",
  [CourseCategory.LOISIR]: "Loisir",
  [CourseCategory.COMPETITION]: "Compétition",
  [CourseCategory.PERSONNALISE]: "Personnalisé",
};

const CATEGORY_ALIASES: Record<string, CourseCategory> = {
  solo: CourseCategory.SOLO,
  loisir: CourseCategory.LOISIR,
  competition: CourseCategory.COMPETITION,
  compétition: CourseCategory.COMPETITION,
  personnalise: CourseCategory.PERSONNALISE,
  personnalisé: CourseCategory.PERSONNALISE,
  personnalisee: CourseCategory.PERSONNALISE,
};

export type ParsedCourseCategory = {
  category: CourseCategory;
  customCategoryName: string;
};

export function courseCategoryLabel(
  category: CourseCategory,
  customCategoryName?: string | null,
): string {
  if (category === CourseCategory.PERSONNALISE) {
    const custom = customCategoryName?.trim();
    return custom || CATEGORY_LABELS[CourseCategory.PERSONNALISE];
  }
  return CATEGORY_LABELS[category] ?? category;
}

export function courseCategoryLabelFromCourse(
  course: Pick<Course, "category" | "customCategoryName">,
): string {
  return courseCategoryLabel(course.category, course.customCategoryName);
}

export function parseCourseCategory(input: string): ParsedCourseCategory {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new BadRequestException(
      "Catégorie requise. Valeurs acceptées : Solo, Loisir, Compétition, ou un libellé personnalisé.",
    );
  }
  const key = normalizeLabel(trimmed);
  const found = CATEGORY_ALIASES[key];
  if (found === CourseCategory.PERSONNALISE) {
    throw new BadRequestException(
      "Pour une catégorie personnalisée, indiquez un libellé (ex. Handisport), pas « Personnalisé » seul.",
    );
  }
  if (found) {
    return { category: found, customCategoryName: "" };
  }
  return { category: CourseCategory.PERSONNALISE, customCategoryName: trimmed };
}

export function normalizeCustomCategoryName(
  category: CourseCategory,
  customCategoryName?: string | null,
): string {
  if (category === CourseCategory.PERSONNALISE) {
    const custom = customCategoryName?.trim() ?? "";
    if (!custom) {
      throw new BadRequestException("Le libellé de catégorie personnalisée est requis.");
    }
    return custom;
  }
  if (customCategoryName?.trim()) {
    throw new BadRequestException(
      "customCategoryName ne doit être renseigné que pour une catégorie Personnalisé.",
    );
  }
  return "";
}

export function courseLookupKey(
  name: string,
  category: CourseCategory,
  customCategoryName = "",
): string {
  const custom =
    category === CourseCategory.PERSONNALISE
      ? normalizeLabel(customCategoryName)
      : "";
  return `${normalizeLabel(name)}|${category}|${custom}`;
}
