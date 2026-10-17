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
  ArrowPathIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  PlayCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout/Layout'
import RecordList, { type RecordItem } from '../components/RecordList'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageLoading from '../components/ui/PageLoading'
import Spinner from '../components/ui/Spinner'
import type { StoredAddress } from '../types'
import { hydratedAtom, useAccountStore } from '../utils/account'
import { ApiError, errorMessage, fetchAddressStatus, updateAddressStatus } from '../utils/api'
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
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const [checkingAll, setCheckingAll] = useState(false)
  const [pendingDeactivate, setPendingDeactivate] = useState<string | null>(null)
  const token = account?.access_token

  const setBusyFor = (value: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev)
      if (on) next.add(value)
      else next.delete(value)
      return next
    })

  const saveStatus = (value: string, active: boolean) => {
    store.setAddressActive(activeIndex, value, active)
    sync()
  }

  /** Query DDG for one address. Returns false on failure (already toasted). */
  const checkStatus = async (value: string, quiet = false): Promise<boolean> => {
    if (!token) {
      toast.error(t('Unauthorized'))
      return false
    }
    setBusyFor(value, true)
    try {
      const { active } = await fetchAddressStatus(token, value)
      saveStatus(value, active)
      return true
    } catch (error) {
      if (!quiet) toast.error(`${t('Status check failed')} (${errorMessage(error)})`)
      if (error instanceof ApiError && error.status === 401) throw error
      return false
    } finally {
      setBusyFor(value, false)
    }
  }

  const checkAll = async (values: string[]) => {
    setCheckingAll(true)
    let failed = 0
    try {
      // Sequential on purpose: stay gentle with DuckDuckGo's rate limits.
      for (const value of values) {
        if (!(await checkStatus(value, true))) failed++
      }
      if (failed === 0) toast.success(t('Status updated'))
      else toast.error(t('{{value}} status checks failed', { value: failed }))
    } catch (error) {
      toast.error(`${t('Status check failed')} (${errorMessage(error)})`)
    } finally {
      setCheckingAll(false)
    }
  }

  const setActive = async (value: string, active: boolean) => {
    if (!token) {
      toast.error(t('Unauthorized'))
      return
    }
    setBusyFor(value, true)
    try {
      const result = await updateAddressStatus(token, value, active)
      saveStatus(value, result.active)
      toast.success(result.active ? t('Address reactivated') : t('Address deactivated'))
    } catch (error) {
      toast.error(`${t('Status update failed')} (${errorMessage(error)})`)
    } finally {
      setBusyFor(value, false)
    }
  }

  const statusBadge = (address: StoredAddress) => {
    const pending = busy.has(address.value)
    const className =
      address.active === true
        ? 'badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
        : address.active === false
          ? 'badge bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
          : 'badge badge-neutral'
    const label =
      address.active === true
        ? t('Active')
        : address.active === false
          ? t('Deactivated')
          : t('Check status')
    return (
      <button
        type="button"
        className={`${className} cursor-pointer`}
        disabled={pending}
        onClick={() => void checkStatus(address.value).catch(() => undefined)}
        title={t('Check status')}
      >
        {pending && <Spinner className="h-3 w-3" />}
        {label}
      </button>
    )
  }

  const statusAction = (address: StoredAddress) => {
    const pending = busy.has(address.value)
    if (address.active === false) {
      return (
        <button
          type="button"
          className="icon-btn opacity-60 hover:text-emerald-600 group-hover:opacity-100 dark:hover:text-emerald-400"
          disabled={pending}
          onClick={() => void setActive(address.value, true)}
          title={t('Reactivate')}
          aria-label={`${t('Reactivate')} ${fullAddress(address.value)}`}
        >
          <PlayCircleIcon className="h-4 w-4" />
        </button>
      )
    }
    return (
      <button
        type="button"
        className="icon-btn opacity-60 hover:text-amber-600 group-hover:opacity-100 dark:hover:text-amber-400"
        disabled={pending}
        onClick={() => setPendingDeactivate(address.value)}
        title={t('Deactivate')}
        aria-label={`${t('Deactivate')} ${fullAddress(address.value)}`}
      >
        <NoSymbolIcon className="h-4 w-4" />
      </button>
    )
  }

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
    badge: statusBadge(address),
    actions: statusAction(address),
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={checkingAll || filtered.length === 0}
              onClick={() => void checkAll(filtered.map((address) => address.value))}
              title={t('Check status hint')}
            >
              {checkingAll ? <Spinner className="h-4 w-4" /> : <ArrowPathIcon className="h-4 w-4" />}
              {t('Check status')}
            </button>
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
          deleteTitle={t('Remove from vault')}
          deleteHint={t('Remove from vault hint')}
        />

        <ConfirmDialog
          open={!!pendingDeactivate}
          title={t('Deactivate address')}
          message={`${pendingDeactivate ? fullAddress(pendingDeactivate) : ''}\n\n${t('Deactivate hint')}`}
          confirmLabel={t('Deactivate')}
          onCancel={() => setPendingDeactivate(null)}
          onConfirm={() => {
            if (pendingDeactivate) void setActive(pendingDeactivate, false)
            setPendingDeactivate(null)
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
