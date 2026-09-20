import { apiFetch } from "@/backend/api/server"
import { KnowledgeView, type KnowledgeDocumentRow } from "./knowledge-view"

export default async function KnowledgeBasePage() {
  const documents = await apiFetch<KnowledgeDocumentRow[]>("/admin/knowledge")

  return <KnowledgeView initialDocuments={documents} />
}
