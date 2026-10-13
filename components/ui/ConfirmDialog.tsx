import { useTranslation } from 'next-i18next/pages'
import Modal from './Modal'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = true,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}) {
  const { t } = useTranslation('common')

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      maxWidth="max-w-md"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t('Cancel')}
          </button>
          <button
            type="button"
            className={danger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('Confirm')}
          </button>
        </>
      }
    >
      <p className="text-sm whitespace-pre-line text-slate-600 dark:text-slate-300">{message}</p>
    </Modal>
  )
}
