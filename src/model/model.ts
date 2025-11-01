import z from "zod";

export const RankingSchema = z.object({
    timestamp: z.number(),
    titleIds: z.array(z.string()), // Assumed to be sorted by rank
})
export type Ranking = z.infer<typeof RankingSchema>

export const TitleSchema = z.object({
    name: z.string(),
    url: z.url(),
    img: z.string().optional(),
})
export type TitleEntry = z.infer<typeof TitleSchema>

export const CategorySchema = z.object({
    name: z.string(),
    rankings: z.array(RankingSchema), // Assumed to be sorted by timestamp
    titles: z.record(z.string(), TitleSchema), 
})
export type Category = z.infer<typeof CategorySchema>