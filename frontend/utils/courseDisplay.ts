import type { ApiCourse, CourseCategoryApi } from '~/types/api'

const CATEGORY_LABELS: Record<CourseCategoryApi, string> = {
  SOLO: 'Solo',
  LOISIR: 'Loisir',
  COMPETITION: 'Compétition',
}

export function courseCategoryLabel(category: CourseCategoryApi | string | undefined): string {
  if (!category) return ''
  return CATEGORY_LABELS[category as CourseCategoryApi] ?? String(category)
}

export function courseDisplayLabel(course: Pick<ApiCourse, 'name' | 'category'> | null | undefined): string {
  if (!course?.name) return ''
  const cat = courseCategoryLabel(course.category)
  return cat ? `${course.name} (${cat})` : course.name
}

export const COURSE_CATEGORY_OPTIONS: { title: string; value: CourseCategoryApi }[] = [
  { title: 'Solo', value: 'SOLO' },
  { title: 'Loisir', value: 'LOISIR' },
  { title: 'Compétition', value: 'COMPETITION' },
]
