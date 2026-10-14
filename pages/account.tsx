import type { GetStaticProps, NextPage } from 'next'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAtomValue } from 'jotai'
import toast from 'react-hot-toast'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  AtSymbolIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout/Layout'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import PageLoading from '../components/ui/PageLoading'
import Spinner from '../components/ui/Spinner'
import CopyButton from '../components/ui/CopyButton'
import { errorMessage, fetchDashboard } from '../utils/api'
import { hydratedAtom, useAccountStore } from '../utils/account'
import { formatDate } from '../utils/date'
import * as store from '../utils/store'

function maskEmail(value?: string) {
  if (!value) return ''
  const [local, domain] = value.split('@')
  if (!domain) return '••••••'
  const head = local.slice(0, 2)
  return `${head}${'•'.repeat(Math.max(local.length - head.length, 2))}@${domain}`
}

const AccountPage: NextPage = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { accounts, account, activeIndex, sync } = useAccountStore()
  const [showEmail, setShowEmail] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<number | null>(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const hydrated = useAtomValue(hydratedAtom)

  if (!hydrated) {
    return (
      <Layout title={t('nav.account')} className="max-w-3xl">
        <PageLoading rows={2} />
      </Layout>
    )
  }

  if (!account) {
    // useAccountSync is already redirecting to /login from here, so show the
    // skeleton instead of flashing an error for a frame.
    return (
      <Layout title={t('nav.account')} className="max-w-3xl">
        <PageLoading rows={2} />
      </Layout>
    )
  }

  const localCount = account.addresses?.length ?? 0
  const sendCount = account.reverseAliases?.length ?? 0

  const refresh = async () => {
    // Dashboard only accepts the passphrase-login session token, not the access token.
    if (!account.session_token) {
      toast.error(t('Unauthorized'))
      return
    }
    setRefreshing(true)
    try {
      const dashboard = await fetchDashboard(account.session_token)
      store.editAccount(activeIndex, {
        email: dashboard.user?.email ?? account.email,
        cohort: dashboard.user?.cohort ?? account.cohort,
        addressesGenerated: dashboard.stats?.addresses_generated ?? account.addressesGenerated,
      })
      sync()
      toast.success(t('Stats updated'))
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Layout title={t('nav.account')} className="max-w-3xl">
      <div className="animate-rise space-y-6">
        <div className="card card-pad">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="rounded-xl bg-sky-100 p-2.5 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400">
                <UserCircleIcon className="h-6 w-6" />
              </span>
              <div>
                <p className="addr font-semibold text-slate-800 dark:text-slate-100">
                  {account.username}@duck.com
                </p>
                <p className="mt-0.5 text-xs muted">
                  {t('Member since')} {formatDate(account.createdAt, router.locale)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CopyButton text={`${account.username}@duck.com`} />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={refresh}
                disabled={refreshing}
              >
                {refreshing ? <Spinner /> : <ArrowPathIcon className="h-4 w-4" />}
                {t('Refresh stats')}
              </button>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-100/70 px-3.5 py-2.5 dark:bg-slate-800/50">
              <dt className="text-xs muted">{t('Forwarding address')}</dt>
              <dd className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-200">
                {showEmail ? account.email || t('Unknown') : maskEmail(account.email) || t('Unknown')}
                <button
                  type="button"
                  className="icon-btn p-1"
                  onClick={() => setShowEmail((value) => !value)}
                  aria-label={showEmail ? t('Hide') : t('Reveal')}
                >
                  {showEmail ? <EyeSlashIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                </button>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-100/70 px-3.5 py-2.5 dark:bg-slate-800/50">
              <dt className="text-xs muted">{t('Cohort')}</dt>
              <dd className="font-mono text-xs text-slate-700 dark:text-slate-200">
                {account.cohort || t('Unknown')}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-100/70 px-3.5 py-2.5 dark:bg-slate-800/50">
              <dt className="text-xs muted">{t('Addresses generated')}</dt>
              <dd className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {account.addressesGenerated ?? 0}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-100/70 px-3.5 py-2.5 dark:bg-slate-800/50">
              <dt className="text-xs muted">{t('Saved on this device')}</dt>
              <dd className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t('{{value}} aliases', { value: localCount })} · {t('{{value}} send', { value: sendCount })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <h3 className="section-title">{t('Accounts')}</h3>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => void router.push('/login?add=1')}
            >
              <PlusIcon className="h-4 w-4" />
              {t('Add account')}
            </button>
          </div>

          <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
            {accounts.map((item, index) => (
              <li key={`${item.username}-${index}`} className="flex items-center gap-3 py-3">
                <AtSymbolIcon className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-slate-700 dark:text-slate-200">
                    {item.username}@duck.com
                  </p>
                  <p className="text-xs muted">
                    {t('{{value}} aliases', { value: item.addresses?.length ?? 0 })}
                  </p>
                </div>
                {index === activeIndex ? (
                  <span className="badge badge-brand">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    {t('Current')}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() =>
                      void router.push({ pathname: router.pathname, query: { ...router.query, id: index } })
                    }
                  >
                    {t('Switch')}
                  </button>
                )}
                <button
                  type="button"
                  className="icon-btn hover:text-rose-600 dark:hover:text-rose-400"
                  onClick={() => setPendingRemove(index)}
                  aria-label={`${t('Remove')} ${item.username}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card card-pad border-rose-200 dark:border-rose-500/30">
          <h3 className="section-title text-rose-600 dark:text-rose-400">{t('Danger zone')}</h3>
          <p className="mt-1 text-sm muted">{t('Sign out hint')}</p>
          <button
            type="button"
            className="btn btn-danger mt-4"
            onClick={() => setConfirmSignOut(true)}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            {t('Sign out of all accounts')}
          </button>
        </div>

        <p className="alert alert-warn text-xs">{t('DDG Email Panel respects your privacy')}</p>
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={t('Remove account')}
        message={t('Remove account confirm')}
        confirmLabel={t('Remove')}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          const index = pendingRemove
          setPendingRemove(null)
          if (index === null) return
          store.removeAccount(index)
          const rest = store.getAccounts()
          sync()
          toast.success(t('Account removed'))
          if (rest.length === 0) {
            void router.replace('/login')
            return
          }
          const next = index === activeIndex ? 0 : activeIndex
          void router.replace({ pathname: '/account', query: { id: next } })
        }}
      />

      <ConfirmDialog
        open={confirmSignOut}
        title={t('Sign out of all accounts')}
        message={t('Sign out confirm')}
        confirmLabel={t('Sign out')}
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false)
          store.clear()
          sync()
          void router.replace('/login')
        }}
      />
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

export default AccountPage
