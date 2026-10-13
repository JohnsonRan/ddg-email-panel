import Head from 'next/head'
import { Toaster } from 'react-hot-toast'
import { useTranslation } from 'next-i18next/pages'
import Nav, { NavToggle } from './Nav'
import AccountMenu from './AccountMenu'
import { useAccountSync } from '../../utils/account'

export default function Layout({
  children,
  className,
  title,
}: {
  children: React.ReactNode
  className?: string | undefined
  title: string
}) {
  const { t } = useTranslation('common')
  useAccountSync()

  return (
    <>
      <Head>
        <title>{title ? `${title} - DDG Email Panel` : 'DDG Email Panel'}</title>
        <meta property="og:title" content={title ? `${title} - DDG Email Panel` : 'DDG Email Panel'} />
        <meta property="og:description" content={t('DDG Email Introduction')} />
        <meta name="description" content={t('DDG Email Introduction')} />
      </Head>

      <div className="flex h-screen overflow-hidden">
        <Nav />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 px-3 backdrop-blur sm:px-5 dark:border-slate-800 dark:bg-slate-900/60">
            <NavToggle />
            <h1 className="truncate text-sm font-semibold text-slate-800 sm:text-base dark:text-slate-100">
              {title}
            </h1>
            <div className="ml-auto flex items-center gap-2">
              <AccountMenu />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className={`mx-auto w-full ${className || 'max-w-5xl'}`}>{children}</div>
          </main>
        </div>
      </div>

      <Toaster
        position="top-center"
        toastOptions={{
          className:
            'dark:bg-slate-800! dark:text-slate-100! dark:border! dark:border-slate-700! rounded-xl!',
        }}
      />
    </>
  )
}
