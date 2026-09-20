import { apiFetch } from "@/backend/api/server"
import { HelpArticlesView, type HelpArticle } from "./help-articles-view"

export default async function HelpArticlesPage() {
  const articles = await apiFetch<HelpArticle[]>("/help-articles")

  return <HelpArticlesView initialArticles={articles} />
}
