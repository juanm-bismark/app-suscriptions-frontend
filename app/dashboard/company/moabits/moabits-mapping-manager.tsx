"use client"

import { Alert, AlertDescription } from "@/components/ui"
import type { Page } from "@/lib/types/user"
import type { LocalCompanyMoabitsMappingOut } from "@/lib/types/api"
import { MappingEditor, MappingOverview, useMoabitsMappingManager } from "./mapping"

export function MoabitsMappingManager({
  initialPage,
  currentPage,
  pageSize,
  query,
}: {
  initialPage: Page<LocalCompanyMoabitsMappingOut>
  currentPage: number
  pageSize: number
  query: string
}) {
  const manager = useMoabitsMappingManager({ initialPage, currentPage, pageSize, query })

  return (
    <div className="space-y-6">
      {manager.error && (
        <Alert variant="destructive">
          <AlertDescription>{manager.error}</AlertDescription>
        </Alert>
      )}
      {manager.success && (
        <Alert variant="success">
          <AlertDescription>{manager.success}</AlertDescription>
        </Alert>
      )}

      <MappingOverview
        linkedRows={manager.linkedRows}
        linkedCount={manager.linkedCount}
        allMappingsCount={manager.allMappings.length}
        moabitsCompanyCount={manager.discovery ? manager.discovery.moabits_companies.length : manager.cachedMoabitsCompanies.length}
        moabitsCompanyLabel={manager.discovery ? "Moabits en vivo" : "Cache Moabits"}
        pageInfo={manager.pageInfo}
        pageSize={pageSize}
        query={query}
        moabitsOptions={manager.moabitsOptions}
        loadingDb={manager.loadingDb}
        loadingDiscovery={manager.loadingDiscovery}
        confirmingId={manager.confirmingId}
        deletingId={manager.deletingId}
        onRefreshDb={() => void manager.refreshFromDb()}
        onRefreshDiscovery={() => void manager.refreshDiscoveryOnly()}
        onStartCreate={manager.startCreate}
        onEdit={manager.startEdit}
        onConfirmRemove={manager.setConfirmingId}
        onCancelRemove={() => manager.setConfirmingId(null)}
        onRemove={(companyId) => void manager.removeMappingById(companyId)}
      />

      {manager.editing && manager.editorMode && (
        <MappingEditor
          editorMode={manager.editorMode}
          draft={manager.draft}
          editorLocalCompanyOptions={manager.localCompanyOptions}
          moabitsSearchOptions={manager.moabitsSearchOptions}
          moabitsOptions={manager.moabitsOptions}
          moabitsOptionSource={manager.moabitsOptionSource}
          discoveryActive={Boolean(manager.discovery)}
          selectedLocalCompany={manager.selectedLocalCompany}
          selectedMoabitsCompany={manager.selectedMoabitsCompany}
          selectedMoabitsTitle={manager.selectedMoabitsTitle}
          selectedMoabitsDetail={manager.selectedMoabitsDetail}
          selectedMapping={manager.selectedMapping}
          linkedElsewhere={manager.linkedElsewhere}
          namesMatch={manager.namesMatch}
          saving={manager.saving}
          deletingId={manager.deletingId}
          onClose={manager.closeEditor}
          onSelectLocalCompany={manager.selectLocalCompany}
          onSelectMoabitsCompany={manager.applyMoabitsCompany}
          onDraftChange={manager.updateDraft}
          onSave={() => void manager.saveMapping()}
          onRemoveMapping={(companyId) => void manager.removeMappingById(companyId)}
        />
      )}
    </div>
  )
}

