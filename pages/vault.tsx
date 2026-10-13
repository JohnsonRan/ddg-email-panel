import type { GetStaticProps, NextPage } from 'next'
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useAtomValue } from 'jotai'
import toast from 'react-hot-toast'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import {
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout/Layout'
import RecordList, { type RecordItem } from '../components/RecordList'
import PageLoading from '../components/ui/PageLoading'
import { hydratedAtom, useAccountStore } from '../utils/account'
import { fullAddress } from '../utils/sendAddress'
import * as store from '../utils/store'
import { applyImport, buildExport, downloadJson, parseImport } from '../utils/vault'

const VaultPage: NextPage = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { account, activeIndex, sync } = useAccountStore()
  const fileInput = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const hydrated = useAtomValue(hydratedAtom)

  const addresses = useMemo(() => account?.addresses ?? [], [account?.addresses])

  const allTags = useMemo(
    () => Array.from(new Set(addresses.flatMap((address) => address.tags ?? []))).sort(),
    [addresses]
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return addresses.filter((address) => {
      if (activeTag && !(address.tags ?? []).includes(activeTag)) return false
      if (!needle) return true
      return (
        address.value.toLowerCase().includes(needle) ||
        (address.notes ?? '').toLowerCase().includes(needle) ||
        (address.tags ?? []).some((tag) => tag.toLowerCase().includes(needle))
      )
    })
  }, [addresses, query, activeTag])

  const items: RecordItem[] = filtered.map((address) => ({
    key: address.value,
    title: fullAddress(address.value),
    notes: address.notes ?? '',
    tags: address.tags,
    createdAt: address.createdAt,
  }))

  const handleImport = async (file: File) => {
    const text = await file.text()
    const parsed = parseImport(text)
    if (Object.keys(parsed.byAccount).length === 0) {
      toast.error(t('Nothing to import'))
      return
    }
    const added = applyImport(parsed, activeIndex)
    sync()
    if (added === 0) toast(t('No new addresses to import'))
    else toast.success(t('Imported {{value}} addresses', { value: added }))
    if (parsed.invalid > 0) toast.error(t('{{value}} entries were skipped', { value: parsed.invalid }))
  }

  if (!hydrated) {
    return (
      <Layout title={t('nav.vault')} className="max-w-3xl">
        <PageLoading rows={4} />
      </Layout>
    )
  }

  return (
    <Layout title={t('nav.vault')} className="max-w-3xl">
      <div className="animate-rise space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {t('Alias vault')}
            </h2>
            <p className="text-sm muted">{t('Alias vault hint')}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                downloadJson(
                  `ddg-email-panel-backup-${new Date().toISOString().slice(0, 10)}.json`,
                  buildExport()
                )
                toast.success(t('Backup downloaded'))
              }}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {t('Export')}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInput.current?.click()}
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {t('Import')}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json,.txt,.csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) void handleImport(file)
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <span className="field-prefix">
              <MagnifyingGlassIcon className="h-4 w-4" />
            </span>
            <input
              className="input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search addresses, notes or tags')}
            />
            {query && (
              <button
                type="button"
                className="icon-btn absolute inset-y-0 right-0 my-1 mr-1"
                onClick={() => setQuery('')}
                aria-label={t('Clear search')}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs muted">{t('Tags')}:</span>
              <button
                type="button"
                className={`badge ${activeTag === null ? 'bg-sky-500 text-white' : 'badge-neutral'}`}
                onClick={() => setActiveTag(null)}
              >
                {t('All')}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`badge ${
                    activeTag === tag ? 'bg-sky-500 text-white' : 'badge-neutral'
                  }`}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        <RecordList
          items={items}
          locale={router.locale}
          allTags={allTags}
          activeTag={activeTag}
          onTagClick={setActiveTag}
          icon={<ArchiveBoxIcon className="h-8 w-8" />}
          emptyTitle={addresses.length === 0 ? t('No addresses yet') : t('No matching addresses')}
          emptyDescription={
            addresses.length === 0 ? t('Generate your first private address') : t('Try another search')
          }
          action={
            addresses.length === 0 ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void router.push({ pathname: '/email', query: { id: activeIndex } })}
              >
                {t('nav.addresses')}
              </button>
            ) : undefined
          }
          onUpdateNotes={(key, notes) => {
            store.editAddress(activeIndex, key, { notes })
            sync()
          }}
          onUpdateTags={(key, tags) => {
            store.editAddress(activeIndex, key, { tags })
            sync()
          }}
          onDelete={(key) => {
            store.removeAddress(activeIndex, key)
            sync()
          }}
        />

        <p className="text-xs muted">{t('Vault hint')}</p>
      </div>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async (ctx) => {
  return {
    props: {
      ...(await serverSideTranslations(ctx.locale || 'en', ['common'])),
    },
  }
}

export default VaultPage
