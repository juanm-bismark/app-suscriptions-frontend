"use client"

import { CompanyEditor } from "./company-editor"
import { CompanyList } from "./company-list"
import { DeleteCompanyDialog } from "./delete-company-dialog"
import type { CompanyManagerProps } from "./types"
import { useCompanyManager } from "./use-company-manager"

export default function CompanyManager(props: CompanyManagerProps) {
  const manager = useCompanyManager(props)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.95fr)_minmax(360px,1.05fr)]">
      <CompanyList
        companies={manager.companies}
        total={manager.total}
        query={manager.query}
        selected={manager.selected}
        searchError={manager.searchError}
        isSearching={manager.isSearching}
        isDeleting={manager.isDeleting}
        deleteTarget={manager.deleteTarget}
        page={manager.page}
        pages={manager.pages}
        pageSize={manager.pageSize}
        onQueryChange={manager.updateQuery}
        onSelectCompany={manager.selectCompany}
        onStartCreate={manager.startCreateCompany}
        onRequestDelete={manager.requestDeleteCompany}
        onPageSizeChange={manager.updatePageSize}
        onPreviousPage={() => manager.goToPage(manager.page - 1)}
        onNextPage={() => manager.goToPage(manager.page + 1)}
      />

      <CompanyEditor
        selected={manager.selected}
        isCreatingNew={manager.isCreatingNew}
        draftName={manager.draftName}
        selectedCreatedAt={manager.selectedCreatedAt}
        saveError={manager.saveError}
        success={manager.success}
        isSaving={manager.isSaving}
        isDeleting={manager.isDeleting}
        deleteTarget={manager.deleteTarget}
        onDraftNameChange={manager.setDraftName}
        onSubmit={manager.onSubmit}
        onCancelCreate={manager.clearSelectedCompany}
        onRequestDelete={manager.requestDeleteCompany}
      />

      {manager.deleteTarget && (
        <DeleteCompanyDialog
          company={manager.deleteTarget}
          deleting={manager.isDeleting}
          open={Boolean(manager.deleteTarget)}
          onOpenChange={manager.updateDeleteDialogOpen}
          onConfirm={manager.onDeleteTarget}
        />
      )}
    </div>
  )
}

export { CompanyEditor } from "./company-editor"
export { CompanyList } from "./company-list"
export { DeleteCompanyDialog } from "./delete-company-dialog"
export type { CompanyManagerProps } from "./types"
export { useCompanyManager } from "./use-company-manager"

