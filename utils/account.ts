import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { atom, useAtom } from 'jotai'
import type { Account } from '../types'
import * as store from './store'

/** Single source of truth for accounts, kept in sync with localStorage. */
export const accountsAtom = atom<Account[]>([])
export const activeIndexAtom = atom<number>(0)
/** False until localStorage has been read on the client. */
export const hydratedAtom = atom<boolean>(false)

export function useAccountStore() {
  const [accounts, setAccounts] = useAtom(accountsAtom)
  const activeIndex = useAtom(activeIndexAtom)[0]
  const sync = () => setAccounts(store.getAccounts())

  return {
    accounts,
    activeIndex,
    account: accounts[activeIndex] ?? null,
    sync,
  }
}

/**
 * Keeps the jotai account state, the `?id=` query param and localStorage in
 * sync. Mounted once by the layout.
 */
export function useAccountSync() {
  const router = useRouter()
  const [, setAccounts] = useAtom(accountsAtom)
  const [, setActiveIndex] = useAtom(activeIndexAtom)
  const [, setHydrated] = useAtom(hydratedAtom)

  useEffect(() => {
    if (!router.isReady) return
    const accounts = store.getAccounts()
    setAccounts(accounts)
    setHydrated(true)

    const isLogin = router.pathname === '/login'
    const addingAccount = isLogin && !!router.query.add

    if (accounts.length === 0) {
      setActiveIndex(0)
      if (!isLogin) void router.replace('/login')
      return
    }

    const queryId = Number(router.query.id)
    const valid = Number.isInteger(queryId) && queryId >= 0 && !!accounts[queryId]
    const last = store.getLastUserId()
    const index = valid ? queryId : accounts[last] ? last : 0

    setActiveIndex(index)
    store.setLastUserId(index)

    if (addingAccount) return
    if (isLogin) {
      void router.replace({ pathname: '/email', query: { id: index } })
      return
    }
    if (!valid) {
      void router.replace({ pathname: router.pathname, query: { ...router.query, id: index } })
    }
  }, [router, setAccounts, setActiveIndex, setHydrated])
}
