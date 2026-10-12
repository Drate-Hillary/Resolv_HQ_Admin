import { PageStatus } from "@/components/console/page-status"
import { useApiData } from "@/hooks/use-api-data"
import { KnowledgeView, type KnowledgeCategoryRow, type KnowledgeDocumentRow } from "./knowledge-view"

export default function KnowledgeBasePage() {
  const documents = useApiData<KnowledgeDocumentRow[]>("/admin/knowledge")
  const categories = useApiData<KnowledgeCategoryRow[]>("/admin/knowledge-categories")

  if (!documents.data || !categories.data) {
    return (
      <PageStatus
        loading={documents.loading || categories.loading}
        error={documents.error ?? categories.error}
      />
    )
  }

  return <KnowledgeView initialDocuments={documents.data} initialCategories={categories.data} />
}
