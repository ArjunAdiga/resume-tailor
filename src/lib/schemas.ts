import { z } from 'zod'

export const jdSchema = z.object({
  roleTitle: z.string(),
  requiredSkills: z.array(z.string()),
  niceToHaveSkills: z.array(z.string()),
  keywords: z.array(z.string()),
})

export type Jd = z.infer<typeof jdSchema>

export const rewriteSchema = z.object({
  proposed: z.string(),
})
