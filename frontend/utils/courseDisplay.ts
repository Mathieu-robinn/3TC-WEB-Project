import type { ApiCourse, CourseCategoryApi } from '~/types/api'

const CATEGORY_LABELS: Record<CourseCategoryApi, string> = {
  SOLO: 'Solo',
  LOISIR: 'Loisir',
  COMPETITION: 'Compétition',
  PERSONNALISE: 'Personnalisé',
}

export function courseCategoryLabel(
  category: CourseCategoryApi | string | undefined,
  customCategoryName?: string | null,
): string {
  if (!category) return ''
  if (category === 'PERSONNALISE') {
    const custom = customCategoryName?.trim()
    return custom || CATEGORY_LABELS.PERSONNALISE
  }
  return CATEGORY_LABELS[category as CourseCategoryApi] ?? String(category)
}

export function courseDisplayLabel(
  course: Pick<ApiCourse, 'name' | 'category' | 'customCategoryName'> | null | undefined,
): string {
  if (!course?.name) return ''
  const cat = courseCategoryLabel(course.category, course.customCategoryName)
  return cat ? `${course.name} (${cat})` : course.name
}

export const COURSE_CATEGORY_OPTIONS: { title: string; value: CourseCategoryApi }[] = [
  { title: 'Solo', value: 'SOLO' },
  { title: 'Loisir', value: 'LOISIR' },
  { title: 'Compétition', value: 'COMPETITION' },
  { title: 'Personnalisé', value: 'PERSONNALISE' },
]
