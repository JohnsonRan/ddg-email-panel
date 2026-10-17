import type { GetStaticProps, NextPage } from 'next'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { useTranslation } from 'next-i18next/pages'
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations'
import { ArrowLeftIcon, ArrowRightIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline'
import Layout from '../components/Layout/Layout'
import Spinner from '../components/ui/Spinner'
import { USERNAME_REGEX } from '../lib/constants'
import {
  errorMessage,
  generateAddress,
  loginWithPassphrase,
  requestLoginLink,
} from '../utils/api'
import { useAccountStore } from '../utils/account'
import * as store from '../utils/store'
import type { DashboardResponse } from '../types'

type Step = 'username' | 'code'
type Method = 'passphrase' | 'token'

const LoginPage: NextPage = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { accounts, activeIndex, sync } = useAccountStore()

  const [step, setStep] = useState<Step>('username')
  const [method, setMethod] = useState<Method>('passphrase')
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const addingAccount = !!router.query.add
  const hasAccounts = accounts.length > 0

  const checkUsername = () => {
    if (!username.trim()) {
      toast.error(t('Duck Address cannot be empty'))
      return false
    }
    if (!USERNAME_REGEX.test(username.trim())) {
      toast.error(t('Duck Address can only contain letters and numbers'))
      return false
    }
    return true
  }

  const submitUsername = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!checkUsername()) return
    if (method === 'token') {
      setStep('code')
      return
    }
    setLoading(true)
    try {
      await requestLoginLink(username.trim())
      setStep('code')
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  /** Exchange a token (from the passphrase flow or a pasted access token) for an account. */
  const completeLogin = async (token: string, dashboard?: DashboardResponse, sessionToken?: string) => {
    // `/email/dashboard` rejects the access token (401), so a pasted access token is
    // validated by generating an alias first BEFORE persisting anything.
    let initialAlias: string | null = null
    if (!dashboard) {
      const generated = await generateAddress(token)
      initialAlias = generated.address
    }

    const user = dashboard?.user ?? {}
    const name = user.username || username.trim()
    const existing = store.getAccounts().find((item) => item.username === name)

    const index = store.addAccount({
      access_token: token,
      session_token: sessionToken ?? existing?.session_token,
      cohort: user.cohort ?? existing?.cohort ?? '',
      username: name,
      email: user.email ?? existing?.email ?? '',
      addressesGenerated: dashboard?.stats?.addresses_generated ?? existing?.addressesGenerated ?? 0,
      nextAlias: existing?.nextAlias ?? '',
    })

    if (initialAlias) {
      store.addAddress(index, initialAlias, 'generate')
    } else if (!existing?.nextAlias) {
      try {
        const generated = await generateAddress(token)
        store.addAddress(index, generated.address, 'generate')
      } catch {
        /* an alias can be generated later from the addresses page */
      }
    }

    sync()
    toast.success(t('Login Success'))
    void router.replace({ pathname: '/email', query: { id: index } })
  }

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!code.trim()) {
      toast.error(
        method === 'passphrase'
          ? t('One-time Passphrase cannot be empty')
          : t('Access Token cannot be empty')
      )
      return
    }
    setLoading(true)
    try {
      if (method === 'token') {
        await completeLogin(code.trim())
      } else {
        const result = await loginWithPassphrase(username.trim(), code)
        const token = result.user?.access_token
        if (!token) throw new Error(t('Login failed'))
        await completeLogin(token, result, result.token)
      }
    } catch (error) {
      if (method === 'token') {
        toast.error(`${t('The access token cannot generate an alias')} (${errorMessage(error)})`)
      } else {
        toast.error(`${t('Login failed')}: ${errorMessage(error)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title={t('login')} className="max-w-lg">
      <div className="flex min-h-[calc(100vh-11rem)] flex-col justify-center">
        <div className="card card-pad animate-rise">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {step === 'username'
                ? t('Enter your Duck Address')
                : method === 'passphrase'
                  ? t('Check your inbox')
                  : t('Enter your Access Token')}
            </h2>
            <p className="mt-1 text-sm muted">
              {step === 'username'
                ? t('login tip')
                : method === 'passphrase'
                  ? t(
                      'DuckDuckGo One-time Passphrase has been sent to your email address, please enter it below and continue'
                    )
                  : t('token tip')}
            </p>
          </div>

          {step === 'username' ? (
            <form className="space-y-4" onSubmit={submitUsername}>
              <div>
                <label className="label" htmlFor="username">
                  {t('Duck Address')}
                </label>
                <div className="relative">
                  <span className="field-prefix">
                    <EnvelopeIcon className="h-5 w-5" />
                  </span>
                  <input
                    id="username"
                    className="input pr-28 pl-11"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder={t('Duck Address')}
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                  <span className="field-suffix">@duck.com</span>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <Spinner /> : <ArrowRightIcon className="h-4 w-4" />}
                {loading ? t('loading') : t('Continue')}
              </button>

              <button
                type="button"
                className="w-full text-center text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
                onClick={() => {
                  setMethod(method === 'token' ? 'passphrase' : 'token')
                  setCode('')
                }}
              >
                {method === 'token' ? t('Login using one-time passphrase') : t('Login using Access Token')}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submitCode}>
              <div>
                <label className="label" htmlFor="code">
                  {method === 'passphrase' ? t('One-time Passphrase') : t('Access Token')}
                </label>
                <div className="relative">
                  <span className="field-prefix">
                    <KeyIcon className="h-5 w-5" />
                  </span>
                  <input
                    id="code"
                    className="input pl-11"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder={
                      method === 'passphrase'
                        ? t('Enter your one-time passphrase')
                        : t('Enter your Access Token')
                    }
                    autoComplete="one-time-code"
                    spellCheck={false}
                  />
                </div>
                {method === 'token' && (
                  <p className="mt-2 text-xs muted">
                    <Link
                      className="underline underline-offset-2 hover:text-sky-500"
                      href="https://bitwarden.com/help/generator/#tab-duckduckgo-3Uj911RtQsJD9OAhUuoKrz"
                      target="_blank"
                    >
                      {t('How to obtain a Token')}
                    </Link>
                  </p>
                )}
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                {loading ? <Spinner /> : <ArrowRightIcon className="h-4 w-4" />}
                {loading ? t('loading') : t('Continue')}
              </button>

              <button
                type="button"
                className="btn btn-ghost w-full"
                onClick={() => {
                  setCode('')
                  setStep('username')
                }}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                {t('Back')}
              </button>
            </form>
          )}

          <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-center dark:border-slate-800">
            <Link
              className="text-sm text-slate-500 underline-offset-2 hover:text-sky-500 hover:underline dark:text-slate-400"
              href="https://duckduckgo.com/email/start"
              target="_blank"
            >
              {t('No Duck Address')}
            </Link>
            {hasAccounts && (
              <button
                type="button"
                className="block w-full text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
                onClick={() =>
                  void router.replace({ pathname: '/email', query: { id: activeIndex } })
                }
              >
                {addingAccount ? t('Cancel') : t('Back to my addresses')}
              </button>
            )}
          </div>
        </div>

        <p className="alert alert-warn mt-6 text-xs">{t('DDG Email Panel respects your privacy')}</p>
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

export default LoginPage
