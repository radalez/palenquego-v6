import { Metadata } from "next"
import RecommendationPage from "./recommendation-page"

export const metadata: Metadata = {
  title: "Recomendación - Palenquego",
  description: "Recomendación de experiencia",
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return <RecommendationPage params={resolvedParams} />
}
