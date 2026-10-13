import { useRouter } from 'next/router'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useTranslation } from 'next-i18next/pages'
import {
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  PlusIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { useAccountStore } from '../../utils/account'
import * as store from '../../utils/store'

export default function AccountMenu() {
  const router = useRouter()
  const { t } = useTranslation('common')
  const { accounts, account, activeIndex, sync } = useAccountStore()

  if (!account) {
    return (
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={() => void router.push('/login?add=1')}
      >
        <PlusIcon className="h-4 w-4" />
        {t('Add account')}
      </button>
    )
  }

  return (
    <Menu as="div" className="relative">
      <MenuButton className="btn btn-secondary btn-sm max-w-[60vw]">
        <UserCircleIcon className="h-4 w-4 shrink-0 text-sky-500" />
        <span className="truncate font-mono">{account.username}@duck.com</span>
        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="z-50 w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
      >
        {accounts.map((item, index) => (
          <MenuItem key={`${item.username}-${index}`}>
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm data-[focus]:bg-slate-100 dark:data-[focus]:bg-slate-800"
              onClick={() => {
                void router.push({ pathname: router.pathname, query: { ...router.query, id: index } })
              }}
            >
              <span className="flex-1 truncate text-left font-mono text-xs">{item.username}@duck.com</span>
              {index === activeIndex && <span className="badge badge-brand">{t('Current')}</span>}
            </button>
          </MenuItem>
        ))}

        <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

        <MenuItem>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 data-[focus]:bg-slate-100 dark:text-slate-300 dark:data-[focus]:bg-slate-800"
            onClick={() => void router.push('/login?add=1')}
          >
            <PlusIcon className="h-4 w-4" />
            {t('Add another account')}
          </button>
        </MenuItem>
        <MenuItem>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 data-[focus]:bg-rose-50 dark:text-rose-400 dark:data-[focus]:bg-rose-500/10"
            onClick={() => {
              store.clear()
              sync()
              void router.replace('/login')
            }}
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            {t('Sign out of all accounts')}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  )
}
