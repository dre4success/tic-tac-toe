interface ToastProps {
  message: string
  onClose: () => void
}

export function Toast({ message, onClose }: ToastProps) {
  return (
    <div className="toast toast-error">
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">
        ✕
      </button>
    </div>
  )
}
