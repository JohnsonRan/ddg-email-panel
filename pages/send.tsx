import type { GetStaticProps, NextPage } from 'next'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { useAtomValue } from 'jotai'
import toast from 'react-hot-toast'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import {
  ArrowTopRightOnSquareIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'
import Layout from '../components/Layout/Layout'
import CopyButton from '../components/ui/CopyButton'
import RecordList, { type RecordItem } from '../components/RecordList'
import PageLoading from '../components/ui/PageLoading'
import { hydratedAtom, useAccountStore } from '../utils/account'
import { fullAddress, isValidRecipient, toSendAddress } from '../utils/sendAddress'
import * as store from '../utils/store'

const SendPage: NextPage = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { account, activeIndex, sync } = useAccountStore()
  const [sender, setSender] = useState('')
  const [recipient, setRecipient] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const hydrated = useAtomValue(hydratedAtom)

  const aliases = account?.addresses ?? []
  const senderLocal = sender || account?.username || ''

  const items: RecordItem[] = useMemo(
    () =>
      (account?.reverseAliases ?? []).map((item) => ({
        key: item.recipient,
        title: item.alias,
        subtitle: item.recipient,
        notes: item.notes ?? '',
        createdAt: item.createdAt,
      })),
    [account?.reverseAliases]
  )

  const convert = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValidRecipient(recipient)) {
      toast.error(t('Enter a valid recipient address'))
      return
    }
    if (!senderLocal) {
      toast.error(t('Some Error'))
      return
    }
    const alias = toSendAddress(recipient, senderLocal)
    store.addReverseAlias(activeIndex, recipient.trim(), alias)
    sync()
    setResult(alias)
    setRecipient('')
    navigator.clipboard?.writeText(alias).catch(() => undefined)
    toast.success(t('Copied'))
  }

  if (!hydrated) {
    return (
      <Layout title={t('nav.send')} className="max-w-3xl">
        <PageLoading rows={2} />
      </Layout>
    )
  }

  return (
    <Layout title={t('nav.send')} className="max-w-3xl">
      <div className="animate-rise space-y-5">
        <div className="card card-pad">
          <div className="flex items-start gap-4">
            <span className="hidden rounded-xl bg-sky-100 p-2.5 text-sky-600 sm:block dark:bg-sky-500/15 dark:text-sky-400">
              <PaperAirplaneIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {t('Start a new conversation with your Duck address')}
              </h2>
              <p className="mt-1 text-sm muted">{t('Send address hint')}</p>
            </div>
          </div>

          <ol className="mt-5 space-y-1.5 text-sm muted">
            <li>
              <span className="badge badge-neutral mr-2">1</span>
              {t('Enter the recipient address and convert it')}
            </li>
            <li>
              <span className="badge badge-neutral mr-2">2</span>
              {t('Paste the result in the To field of a new email')}
            </li>
            <li>
              <span className="badge badge-neutral mr-2">3</span>
              {t('Send it from the address linked to your DuckDuckGo account')}
            </li>
          </ol>

          <form className="mt-5 grid gap-3 sm:grid-cols-2" onSubmit={convert}>
            <div>
              <label className="label" htmlFor="sender">
                {t('Send from')}
              </label>
              <select
                id="sender"
                className="input"
                value={senderLocal}
                onChange={(event) => setSender(event.target.value)}
              >
                <option value={account?.username}>{account?.username}@duck.com</option>
                {aliases
                  .filter((alias) => alias.value !== account?.username)
                  .map((alias) => (
                    <option key={alias.value} value={alias.value}>
                      {fullAddress(alias.value)}
                      {alias.notes ? ` — ${alias.notes}` : ''}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="recipient">
                {t('Recipient')}
              </label>
              <input
                id="recipient"
                className="input"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="someone@example.com"
                type="email"
                autoCapitalize="none"
                spellCheck={false}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn btn-primary w-full">
                <PaperAirplaneIcon className="h-4 w-4" />
                {t('Convert')}
              </button>
            </div>
          </form>

          {result && (
            <div className="alert alert-success mt-4">
              <p className="font-semibold">{t('Send address')}</p>
              <p className="addr mt-1 break-all">{result}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton text={result} className="btn btn-secondary btn-sm" />
                <a className="btn btn-secondary btn-sm" href={`mailto:${result}`}>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  {t('Open in mail app')}
                </a>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <h3 className="section-title">{t('Send history')}</h3>
            {items.length > 0 && <span className="badge badge-neutral">{items.length}</span>}
          </div>
          <RecordList
            items={items}
            locale={router.locale}
            icon={<PaperAirplaneIcon className="h-8 w-8" />}
            emptyTitle={t('No send addresses yet')}
            emptyDescription={t('Convert a recipient above to get started')}
            onUpdateNotes={(key, notes) => {
              store.editReverseAlias(activeIndex, key, notes)
              sync()
            }}
            onDelete={(key) => {
              store.removeReverseAlias(activeIndex, key)
              sync()
            }}
          />
        </div>

        <div className="alert alert-info flex gap-3">
          <InformationCircleIcon className="h-5 w-5 shrink-0" />
          <span>
            {t('The recipient address is stored on this device only')}{' '}
            <a
              className="underline underline-offset-2"
              href="https://duckduckgo.com/duckduckgo-help-pages/email-protection/duck-addresses/how-do-i-compose-a-new-email"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Learn more')}
            </a>
          </span>
        </div>
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

export default SendPage
