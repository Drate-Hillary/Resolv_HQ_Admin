import { apiFetch } from "@/backend/api/server"
import { KnowledgeView, type KnowledgeCategoryRow, type KnowledgeDocumentRow } from "./knowledge-view"

export default async function KnowledgeBasePage() {
  const [documents, categories] = await Promise.all([
    apiFetch<KnowledgeDocumentRow[]>("/admin/knowledge"),
    apiFetch<KnowledgeCategoryRow[]>("/admin/knowledge-categories"),
  ])

  return <KnowledgeView initialDocuments={documents} initialCategories={categories} />
}
