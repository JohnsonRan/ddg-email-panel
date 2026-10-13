import type { GetStaticProps, NextPage } from 'next'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useAtomValue } from 'jotai'
import toast from 'react-hot-toast'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import {
  ArchiveBoxIcon,
  ArrowRightIcon,
  AtSymbolIcon,
  EnvelopeIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout/Layout'
import CopyButton from '../components/ui/CopyButton'
import PageLoading from '../components/ui/PageLoading'
import Spinner from '../components/ui/Spinner'
import { errorMessage, generateAddress } from '../utils/api'
import { hydratedAtom, useAccountStore } from '../utils/account'
import { formatDateTime } from '../utils/date'
import { fullAddress } from '../utils/sendAddress'
import * as store from '../utils/store'

const AddressesPage: NextPage = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { account, activeIndex, sync } = useAccountStore()
  const [generating, setGenerating] = useState(false)
  const hydrated = useAtomValue(hydratedAtom)

  if (!hydrated) {
    return (
      <Layout title={t('nav.addresses')} className="max-w-3xl">
        <PageLoading />
      </Layout>
    )
  }

  if (!account) {
    // useAccountSync is already redirecting to /login from here, so show the
    // skeleton instead of flashing an error for a frame.
    return (
      <Layout title={t('nav.addresses')} className="max-w-3xl">
        <PageLoading />
      </Layout>
    )
  }

  const vault = account.addresses ?? []
  const recent = vault.slice(0, 3)

  const handleGenerate = async () => {
    if (!account.access_token) {
      toast.error(t('Unauthorized'))
      return
    }
    setGenerating(true)
    try {
      const result = await generateAddress(account.access_token)
      store.addAddress(activeIndex, result.address, 'generate')
      store.editAccount(activeIndex, {
        addressesGenerated: (account.addressesGenerated ?? 0) + 1,
      })
      sync()
      try {
        await navigator.clipboard.writeText(fullAddress(result.address))
      } catch {
        /* clipboard is a bonus, the address is on screen anyway */
      }
      toast.success(t('Copied'))
    } catch (error) {
      toast.error(`${t('Generate failed')} (${errorMessage(error)})`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Layout title={t('nav.addresses')} className="max-w-3xl">
      <div className="animate-rise space-y-6">
        <div className="card card-pad">
          <div className="flex items-start gap-4">
            <span className="hidden rounded-xl bg-sky-100 p-2.5 text-sky-600 sm:block dark:bg-sky-500/15 dark:text-sky-400">
              <EnvelopeIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="section-title">{t('Main Duck Address')}</p>
              <p className="addr mt-1 text-slate-700 dark:text-slate-200">
                {account.username}@duck.com
              </p>
              <p className="mt-1 text-xs muted">{t('Main Duck Address hint')}</p>
            </div>
            <CopyButton text={`${account.username}@duck.com`} />
          </div>
        </div>

        <div className="card card-pad">
          <div className="flex items-start gap-4">
            <span className="hidden rounded-xl bg-emerald-100 p-2.5 text-emerald-600 sm:block dark:bg-emerald-500/15 dark:text-emerald-400">
              <SparklesIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="section-title">{t('Private Duck Address')}</p>
              {account.nextAlias ? (
                <p className="addr mt-1 text-slate-700 dark:text-slate-200">
                  {fullAddress(account.nextAlias)}
                </p>
              ) : (
                <div className="skeleton mt-3 h-4 w-52" />
              )}
              <p className="mt-1 text-xs muted">{t('Private Duck Address hint')}</p>
            </div>
            {account.nextAlias && <CopyButton text={fullAddress(account.nextAlias)} />}
          </div>

          <button
            type="button"
            className="btn btn-primary mt-5 w-full"
            disabled={generating}
            onClick={handleGenerate}
          >
            {generating ? <Spinner /> : <SparklesIcon className="h-5 w-5" />}
            {t('Generate Private Duck Address')}
          </button>
        </div>

        <div className="card card-pad">
          <div className="flex items-center justify-between gap-3">
            <p className="section-title flex items-center gap-2">
              <ArchiveBoxIcon className="h-4 w-4 text-slate-400" />
              {t('Recent addresses')}
              <span className="badge badge-neutral">{vault.length}</span>
            </p>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => void router.push({ pathname: '/vault', query: { id: activeIndex } })}
            >
              {t('Open vault')}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {recent.length === 0 ? (
            <p className="mt-3 text-sm muted">{t('No addresses yet')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
              {recent.map((address) => (
                <li key={address.value} className="flex items-center gap-3 py-2.5">
                  <AtSymbolIcon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="addr min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">
                    {fullAddress(address.value)}
                  </span>
                  <span className="hidden text-xs whitespace-nowrap muted sm:block">
                    {formatDateTime(address.createdAt, router.locale)}
                  </span>
                  <CopyButton text={fullAddress(address.value)} iconOnly className="btn btn-ghost btn-sm" />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="alert alert-success flex gap-3">
          <ShieldCheckIcon className="h-5 w-5 shrink-0" />
          <span>{t('For untrusted websites, Privacy Duck Addresses can hide your email identity')}</span>
        </div>
        <p className="alert alert-warn text-xs">{t('DDG Email Panel respects your privacy')}</p>
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

export default AddressesPage
