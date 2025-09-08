import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

interface ModalProps {
  title: string
  children: React.ReactNode
  onClose: () => void
  actions?: ModalAction[]
  open?: boolean
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const Modal: React.FC<ModalProps> = ({
  title,
  children,
  onClose,
  actions = [],
  open = true,
  className,
  maxWidth = 'lg'
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ backgroundColor: 'rgba(20, 32, 48, 0.6)' }}
        />
        
        {/* Modal Content */}
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 p-6 shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2",
            "data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "bg-white border border-[#85A3B2] rounded-lg",
            maxWidthClasses[maxWidth],
            className
          )}
        >
          {/* Close Button */}
          <DialogPrimitive.Close 
            className="absolute right-4 top-4 rounded-sm transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none p-1"
            onClick={onClose}
          >
            <X className="h-4 w-4" style={{ color: '#142030' }} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Header */}
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title 
              className="text-lg font-semibold leading-none tracking-tight"
              style={{ color: '#1E3442' }}
            >
              {title}
            </DialogPrimitive.Title>
          </div>

          {/* Content */}
          <div style={{ color: '#142030' }}>
            {children}
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    "h-10 px-4 py-2",
                    action.variant === 'secondary' 
                      ? "bg-[#732553] text-white hover:bg-[#1E3442] border border-[#85A3B2]"
                      : "bg-[#FF5C8D] text-white hover:bg-[#732553]",
                    "mt-2 sm:mt-0"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export default Modal