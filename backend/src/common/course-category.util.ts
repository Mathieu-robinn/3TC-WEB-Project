import { BadRequestException } from "@nestjs/common";
import { CourseCategory } from "@prisma/client";
import { normalizeLabel } from "./normalize-label.util.js";

const CATEGORY_LABELS: Record<CourseCategory, string> = {
  [CourseCategory.SOLO]: "Solo",
  [CourseCategory.LOISIR]: "Loisir",
  [CourseCategory.COMPETITION]: "Compétition",
};

const CATEGORY_ALIASES: Record<string, CourseCategory> = {
  solo: CourseCategory.SOLO,
  loisir: CourseCategory.LOISIR,
  competition: CourseCategory.COMPETITION,
  compétition: CourseCategory.COMPETITION,
};

export function courseCategoryLabel(category: CourseCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function parseCourseCategory(input: string): CourseCategory {
  const key = normalizeLabel(input);
  const found = CATEGORY_ALIASES[key];
  if (!found) {
    throw new BadRequestException(
      `Catégorie invalide « ${input.trim()} ». Valeurs acceptées : Solo, Loisir, Compétition.`,
    );
  }
  return found;
}

export function courseLookupKey(name: string, category: CourseCategory): string {
  return `${normalizeLabel(name)}|${category}`;
}
