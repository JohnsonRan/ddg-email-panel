import { useState } from 'react'
import { useTranslation } from 'next-i18next/pages'
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Fallback for non-secure contexts where the async clipboard API is absent.
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export default function CopyButton({
  text,
  className = 'btn btn-secondary btn-sm',
  iconOnly = false,
}: {
  text: string
  className?: string
  iconOnly?: boolean
}) {
  const { t } = useTranslation('common')
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      className={className}
      title={t('Copy')}
      aria-label={t('Copy')}
      onClick={async () => {
        try {
          await writeClipboard(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        } catch {
          /* nothing we can do; user can select the text manually */
        }
      }}
    >
      {copied ? <CheckIcon className="h-4 w-4" /> : <DocumentDuplicateIcon className="h-4 w-4" />}
      {!iconOnly && (copied ? t('Copied') : t('Copy'))}
    </button>
  )
}
