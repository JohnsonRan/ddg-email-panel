import { useState } from 'react'
import { useTranslation } from 'next-i18next/pages'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import CopyButton from './ui/CopyButton'
import ConfirmDialog from './ui/ConfirmDialog'
import EmptyState from './ui/EmptyState'
import { formatDateTime } from '../utils/date'

export interface RecordItem {
  key: string
  /** The value that gets copied (a full address). */
  title: string
  subtitle?: string
  notes?: string
  tags?: string[]
  createdAt?: number
  /** Extra inline content after the title (e.g. a status badge). */
  badge?: React.ReactNode
  /** Extra row buttons rendered before the delete button. */
  actions?: React.ReactNode
}

export default function RecordList({
  items,
  locale,
  emptyTitle,
  emptyDescription,
  onUpdateNotes,
  onUpdateTags,
  onDelete,
  deleteTitle,
  deleteHint,
  activeTag = null,
  onTagClick,
  allTags = [],
  icon,
  action,
}: {
  items: RecordItem[]
  locale?: string
  emptyTitle: string
  emptyDescription?: string
  onUpdateNotes?: (key: string, notes: string) => void
  onUpdateTags?: (key: string, tags: string[]) => void
  onDelete?: (key: string) => void
  /** Delete button label and confirm title; defaults to "Delete" / "Delete address". */
  deleteTitle?: string
  /** Confirm dialog body; defaults to "This action cannot be undone". */
  deleteHint?: string
  activeTag?: string | null
  onTagClick?: (tag: string | null) => void
  allTags?: string[]
  icon?: React.ReactNode
  action?: React.ReactNode
}) {
  const { t } = useTranslation('common')
  const [pendingDelete, setPendingDelete] = useState<RecordItem | null>(null)

  if (items.length === 0) {
    return <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} action={action} />
  }

  return (
    <>
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
        {items.map((item) => (
          <RecordRow
            key={item.key}
            item={item}
            locale={locale}
            allTags={allTags}
            activeTag={activeTag}
            onTagClick={onTagClick}
            onUpdateNotes={onUpdateNotes}
            onUpdateTags={onUpdateTags}
            onDelete={onDelete ? () => setPendingDelete(item) : undefined}
            deleteLabel={deleteTitle ?? t('Delete')}
          />
        ))}
      </ul>

      <ConfirmDialog
        open={!!pendingDelete}
        title={deleteTitle ?? t('Delete address')}
        message={`${pendingDelete?.title}\n\n${deleteHint ?? t('This action cannot be undone')}`}
        confirmLabel={deleteTitle ?? t('Delete')}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete?.(pendingDelete.key)
          setPendingDelete(null)
        }}
      />
    </>
  )
}

function RecordRow({
  item,
  locale,
  allTags,
  activeTag,
  onTagClick,
  onUpdateNotes,
  onUpdateTags,
  onDelete,
  deleteLabel,
}: {
  item: RecordItem
  locale?: string
  allTags: string[]
  activeTag: string | null
  onTagClick?: (tag: string | null) => void
  onUpdateNotes?: (key: string, notes: string) => void
  onUpdateTags?: (key: string, tags: string[]) => void
  onDelete?: () => void
  deleteLabel: string
}) {
  const { t } = useTranslation('common')
  const [tagDraft, setTagDraft] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)
  const tags = item.tags ?? []

  const commitTags = (next: string[]) => {
    const unique = Array.from(new Set(next.map((tag) => tag.trim()).filter(Boolean))).sort()
    onUpdateTags?.(item.key, unique)
  }

  return (
    <li className="group flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-start dark:hover:bg-slate-800/40">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="addr font-medium text-slate-800 dark:text-slate-100">{item.title}</span>
          <CopyButton text={item.title} iconOnly className="btn btn-ghost btn-sm opacity-70" />
          {item.badge}
          {item.createdAt && (
            <span className="text-xs whitespace-nowrap muted">
              {formatDateTime(item.createdAt, locale)}
            </span>
          )}
        </div>

        {item.subtitle && <p className="text-xs muted">{item.subtitle}</p>}

        {onUpdateNotes && (
          <input
            className="input py-1.5 text-xs"
            defaultValue={item.notes ?? ''}
            placeholder={t('Add a note')}
            onBlur={(event) => {
              if (event.target.value !== (item.notes ?? '')) onUpdateNotes(item.key, event.target.value)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
          />
        )}

        {(onUpdateTags || tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`badge-tag badge ${activeTag === tag ? 'border-sky-500 bg-sky-500 text-white' : ''}`}
                onClick={() => onTagClick?.(activeTag === tag ? null : tag)}
                title={onUpdateTags ? t('Remove tag') : undefined}
                onContextMenu={
                  onUpdateTags
                    ? (event) => {
                        event.preventDefault()
                        commitTags(tags.filter((value) => value !== tag))
                      }
                    : undefined
                }
              >
                {tag}
                {onUpdateTags && (
                  <button
                    type="button"
                    aria-label={`${t('Remove tag')} ${tag}`}
                    className="ml-0.5 opacity-60 hover:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation()
                      commitTags(tags.filter((value) => value !== tag))
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}

            {onUpdateTags &&
              (showTagInput ? (
                <>
                  <input
                    autoFocus
                    className="w-40 rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs focus:border-sky-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-950/60"
                    value={tagDraft}
                    list={`tags-${item.key}`}
                    placeholder={t('Tag name')}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onBlur={() => {
                      if (tagDraft.trim()) commitTags([...tags, tagDraft])
                      setTagDraft('')
                      setShowTagInput(false)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur()
                      if (event.key === 'Escape') {
                        setTagDraft('')
                        setShowTagInput(false)
                      }
                    }}
                  />
                  <datalist id={`tags-${item.key}`}>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag} />
                    ))}
                  </datalist>
                </>
              ) : (
                <button
                  type="button"
                  className="badge-tag badge text-slate-400 dark:text-slate-500"
                  onClick={() => setShowTagInput(true)}
                >
                  <PlusIcon className="h-3 w-3" />
                  {t('Tag')}
                </button>
              ))}
          </div>
        )}
      </div>

      {(item.actions || onDelete) && (
        <div className="flex shrink-0 items-center gap-1">
          {item.actions}
          {onDelete && (
            <button
              type="button"
              className="icon-btn opacity-60 hover:text-rose-600 group-hover:opacity-100 dark:hover:text-rose-400"
              onClick={onDelete}
              title={deleteLabel}
              aria-label={`${deleteLabel} ${item.title}`}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </li>
  )
}
