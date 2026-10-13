import { Fragment, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Dialog, DialogPanel, Menu, MenuButton, MenuItem, MenuItems, Transition, TransitionChild } from '@headlessui/react'
import { atom, useAtom } from 'jotai'
import { useTheme } from 'next-themes'
import { useTranslation } from 'next-i18next/pages'
import {
  ArchiveBoxIcon,
  AtSymbolIcon,
  Bars3Icon,
  CheckIcon,
  ChevronUpDownIcon,
  ComputerDesktopIcon,
  LanguageIcon,
  MoonIcon,
  PaperAirplaneIcon,
  SunIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Logo from '../../public/logo.svg'
import GitHubIcon from '../icons/GitHubIcon'
import { useAccountStore } from '../../utils/account'
import { rememberLocale } from '../../utils/locale'

export const navOpenAtom = atom(false)

/** True on the client after hydration, false during SSR — without an effect. */
const emptySubscribe = () => () => {}
const useMounted = () => useSyncExternalStore(emptySubscribe, () => true, () => false)

const REPO_URL = 'https://github.com/whatk233/ddg-email-panel'

const NAV_ITEMS = [
  { key: 'nav.addresses', href: '/email', icon: AtSymbolIcon },
  { key: 'nav.vault', href: '/vault', icon: ArchiveBoxIcon },
  { key: 'nav.send', href: '/send', icon: PaperAirplaneIcon },
  { key: 'nav.account', href: '/account', icon: UserCircleIcon },
]

const LANGUAGES = [
  { locale: 'en', label: 'English' },
  { locale: 'zh-CN', label: '简体中文' },
  { locale: 'ja-JP', label: '日本語' },
]

const THEMES = [
  { value: 'system', icon: ComputerDesktopIcon, key: 'nav.themeItems.system' },
  { value: 'light', icon: SunIcon, key: 'nav.themeItems.light' },
  { value: 'dark', icon: MoonIcon, key: 'nav.themeItems.dark' },
]

export function NavToggle({ className = '' }: { className?: string }) {
  const [, setOpen] = useAtom(navOpenAtom)
  return (
    <button
      type="button"
      className={`icon-btn lg:hidden ${className}`}
      onClick={() => setOpen(true)}
      aria-label="Open navigation"
    >
      <Bars3Icon className="h-5 w-5" />
    </button>
  )
}

function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation('common')
  // next-themes resolves the stored theme only after mount, so rendering the
  // active state during SSR would cause a hydration mismatch.
  const active = useMounted() ? theme : undefined

  return (
    <div className="space-y-1.5">
      <p className="px-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {t('nav.theme')}
      </p>
      <div className="flex gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/70">
        {THEMES.map(({ value, icon: Icon, key }) => (
          <button
            key={value}
            type="button"
            title={t(key)}
            aria-label={t(key)}
            onClick={() => setTheme(value)}
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg py-1.5 transition-colors ${
              active === value
                ? 'bg-white text-sky-600 shadow-xs dark:bg-slate-900 dark:text-sky-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}

function LanguageSwitch() {
  const router = useRouter()
  const current = LANGUAGES.find((item) => item.locale === router.locale) ?? LANGUAGES[0]

  const switchLocale = (locale: string) => {
    if (locale === router.locale) return
    // Remember the choice so that locale-less URLs (e.g. `/vault`) resolve to
    // it as well, not just the prefixed ones.
    rememberLocale(locale)
    void router.push(router.asPath, router.asPath, { locale })
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton className="nav-item">
        <LanguageIcon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{current.label}</span>
        <ChevronUpDownIcon className="h-4 w-4 opacity-60" />
      </MenuButton>
      <MenuItems
        anchor="top start"
        className="z-50 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
      >
        {LANGUAGES.map((language) => (
          <MenuItem key={language.locale}>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 data-[focus]:bg-slate-100 dark:text-slate-300 dark:data-[focus]:bg-slate-800"
              onClick={() => switchLocale(language.locale)}
            >
              <span className="flex-1 text-left">{language.label}</span>
              {language.locale === router.locale && <CheckIcon className="h-4 w-4 text-sky-500" />}
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  )
}

function VersionInfo() {
  const { t } = useTranslation('common')
  const hash = process.env.NEXT_PUBLIC_GIT_LASTCOMMIT_SHORTHASH
  if (!hash) return null
  return (
    <details className="group rounded-xl px-1 text-xs text-slate-400">
      <summary className="cursor-pointer list-none select-none py-1 hover:text-slate-600 dark:hover:text-slate-200">
        {t('nav.version', { shorthash: hash })}
      </summary>
      <p className="pt-1 pb-2 leading-relaxed">
        {process.env.NEXT_PUBLIC_GIT_LASTCOMMIT_DATE?.replace(/^"|"$/g, '') || ''}
      </p>
    </details>
  )
}

export function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const { t } = useTranslation('common')
  const { account, activeIndex } = useAccountStore()
  const isLogin = router.pathname === '/login'

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex items-center gap-3 px-1">
        <Image src={Logo} alt="" className="h-10 w-10" priority />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
            DDG Email Panel
          </p>
          <p className="truncate text-xs muted">
            {account?.username ? `${account.username}@duck.com` : t('emailprotection')}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {!isLogin &&
          NAV_ITEMS.map(({ key, href, icon: Icon }) => {
            const active = router.pathname === href
            return (
              <button
                key={href}
                type="button"
                className={active ? 'nav-item-active' : 'nav-item'}
                onClick={() => {
                  onNavigate?.()
                  void router.push({ pathname: href, query: { id: activeIndex } })
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(key)}</span>
              </button>
            )
          })}

        {isLogin && (
          <a className="nav-item" href={REPO_URL} target="_blank" rel="noopener noreferrer">
            <GitHubIcon className="h-5 w-5 shrink-0" />
            <span>GitHub</span>
          </a>
        )}
      </nav>

      <div className="space-y-3">
        <ThemeSwitch />
        <LanguageSwitch />
        <div className="flex items-center justify-between px-1">
          <a
            className="icon-btn"
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            aria-label="GitHub"
          >
            <GitHubIcon className="h-4 w-4" />
          </a>
          <span className="text-xs muted">MIT</span>
        </div>
        <VersionInfo />
      </div>
    </div>
  )
}

export default function Nav() {
  const [open, setOpen] = useAtom(navOpenAtom)

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-100/80 p-5 lg:block dark:border-slate-800 dark:bg-slate-900/40">
        <NavContent />
      </aside>

      <Transition show={open} as={Fragment}>
        <Dialog onClose={() => setOpen(false)} className="relative z-50 lg:hidden">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm" aria-hidden="true" />
          </TransitionChild>

          <TransitionChild
            as={Fragment}
            enter="ease-out duration-250"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-in duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <DialogPanel className="fixed inset-y-0 left-0 w-72 overflow-y-auto border-r border-slate-200 bg-slate-100 p-5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                className="icon-btn absolute top-4 right-4"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <NavContent onNavigate={() => setOpen(false)} />
            </DialogPanel>
          </TransitionChild>
        </Dialog>
      </Transition>
    </>
  )
}
