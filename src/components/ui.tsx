import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--tcs-brand)] text-white border border-[var(--tcs-brand)] hover:bg-[var(--tcs-brand-800)] hover:border-[var(--tcs-brand-800)] shadow-[var(--tcs-shadow-sm)]',
  secondary: 'bg-[var(--tcs-brand-soft)] text-[var(--tcs-brand-800)] border border-[#c7d6f6] hover:bg-[#dfeaff]',
  ghost: 'bg-transparent text-[var(--tcs-text-muted)] border border-transparent hover:bg-[var(--tcs-surface-muted)] hover:text-[var(--tcs-text)]',
  danger: 'bg-[var(--tcs-danger)] text-white border border-[var(--tcs-danger)] hover:bg-[#a73530]',
  success: 'bg-[var(--tcs-success)] text-white border border-[var(--tcs-success)] hover:bg-[var(--tcs-success-700)]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-[var(--tcs-radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--tcs-radius-md)]',
  lg: 'h-12 px-5 text-base rounded-[var(--tcs-radius-md)]',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(21,84,192,0.18)] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
}

export function Field({ label, hint, error, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[var(--tcs-text)]">
        {label}
        {required && <span className="ml-1 text-[var(--tcs-danger)]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs leading-relaxed text-[var(--tcs-text-muted)]">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--tcs-danger)]">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.25a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
}

const controlBase = 'w-full text-sm text-[var(--tcs-text)] placeholder:text-[var(--tcs-text-faint)] transition-colors focus:outline-none'
const controlFrame = 'bg-white border rounded-[var(--tcs-radius-md)] focus-within:ring-[3px] focus-within:ring-[rgba(21,84,192,0.18)] focus-within:border-[var(--tcs-brand)]'

export function Input({ error, prefix, suffix, className = '', ...props }: InputProps) {
  const border = error ? 'border-[var(--tcs-danger)]' : 'border-[var(--tcs-border)]'
  if (prefix || suffix) {
    return (
      <div className={`flex h-11 w-full items-center overflow-hidden ${controlFrame} ${border}`}>
        {prefix && <span className="shrink-0 pl-3.5 pr-2 text-[var(--tcs-text-muted)]">{prefix}</span>}
        <input className={`h-full min-w-0 flex-1 bg-transparent pr-3.5 ${prefix ? '' : 'pl-3.5'} ${controlBase} ${className}`} {...props} />
        {suffix && <span className="shrink-0 pl-2 pr-3.5 text-[var(--tcs-text-muted)]">{suffix}</span>}
      </div>
    )
  }

  return (
    <input
      className={`h-11 px-3.5 ${controlBase} bg-white border rounded-[var(--tcs-radius-md)] focus:ring-[3px] focus:ring-[rgba(21,84,192,0.18)] focus:border-[var(--tcs-brand)] ${border} ${className}`}
      {...props}
    />
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  children: ReactNode
}

export function Select({ error, children, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`h-11 w-full appearance-none rounded-[var(--tcs-radius-md)] border bg-white px-3.5 text-sm text-[var(--tcs-text)] transition-colors focus:outline-none focus:ring-[3px] focus:ring-[rgba(21,84,192,0.18)] focus:border-[var(--tcs-brand)] ${error ? 'border-[var(--tcs-danger)]' : 'border-[var(--tcs-border)]'} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full resize-none rounded-[var(--tcs-radius-md)] border bg-white px-3.5 py-2.5 text-sm text-[var(--tcs-text)] placeholder:text-[var(--tcs-text-faint)] transition-colors focus:outline-none focus:ring-[3px] focus:ring-[rgba(21,84,192,0.18)] focus:border-[var(--tcs-brand)] ${error ? 'border-[var(--tcs-danger)]' : 'border-[var(--tcs-border)]'} ${className}`}
      {...props}
    />
  )
}

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const padMap = { sm: 'p-4', md: 'p-5', lg: 'p-6 sm:p-7' }
  return (
    <div className={`tcs-surface rounded-[var(--tcs-radius-lg)] ${padMap[padding]} ${className}`}>
      {children}
    </div>
  )
}

type BadgeVariant = 'not-started' | 'pending' | 'verified' | 'rejected' | 'info'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const badgeStyles: Record<BadgeVariant, string> = {
  'not-started': 'bg-[var(--tcs-surface-muted)] text-[var(--tcs-text-muted)] border-[var(--tcs-border)]',
  pending: 'bg-[var(--tcs-warning-soft)] text-[#8a5b12] border-[#efd38e]',
  verified: 'bg-[var(--tcs-success-soft)] text-[#08714d] border-[#b7dfcc]',
  rejected: 'bg-[var(--tcs-danger-soft)] text-[#9b312c] border-[#ecc1bd]',
  info: 'bg-[var(--tcs-info-soft)] text-[var(--tcs-brand-800)] border-[#c7d6f6]',
}

const badgeDot: Record<BadgeVariant, string> = {
  'not-started': 'bg-[var(--tcs-text-faint)]',
  pending: 'bg-[var(--tcs-warning)]',
  verified: 'bg-[var(--tcs-success)]',
  rejected: 'bg-[var(--tcs-danger)]',
  info: 'bg-[var(--tcs-info)]',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-[var(--tcs-radius-xs)] border px-2 py-1 text-xs font-bold ${badgeStyles[variant]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${badgeDot[variant]}`} />
      {children}
    </span>
  )
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="my-4 border-[var(--tcs-border)]" />
  return (
    <div className="my-4 flex items-center gap-3">
      <hr className="flex-1 border-[var(--tcs-border)]" />
      <span className="text-xs font-semibold text-[var(--tcs-text-faint)]">{label}</span>
      <hr className="flex-1 border-[var(--tcs-border)]" />
    </div>
  )
}

type AlertType = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  type: AlertType
  title?: string
  children: ReactNode
  className?: string
}

const alertStyles: Record<AlertType, { wrap: string; icon: ReactNode }> = {
  info: {
    wrap: 'bg-[var(--tcs-info-soft)] border-[#c7d6f6] text-[var(--tcs-brand-800)]',
    icon: <path d="M8 1a7 7 0 110 14A7 7 0 018 1zm.75 6.25a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0v-4zM8 4.5a.875.875 0 100 1.75A.875.875 0 008 4.5z" />,
  },
  success: {
    wrap: 'bg-[var(--tcs-success-soft)] border-[#b7dfcc] text-[#08714d]',
    icon: <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />,
  },
  warning: {
    wrap: 'bg-[var(--tcs-warning-soft)] border-[#efd38e] text-[#8a5b12]',
    icon: <path d="M8 1.5l7 12H1l7-12zm0 4a.75.75 0 00-.75.75v3a.75.75 0 001.5 0v-3A.75.75 0 008 5.5zm0 6a.8.8 0 100 1.6.8.8 0 000-1.6z" />,
  },
  error: {
    wrap: 'bg-[var(--tcs-danger-soft)] border-[#ecc1bd] text-[#9b312c]',
    icon: <path d="M8 1a7 7 0 110 14A7 7 0 018 1zM5.72 5.72a.75.75 0 000 1.06L6.94 8 5.72 9.22a.75.75 0 101.06 1.06L8 9.06l1.22 1.22a.75.75 0 101.06-1.06L9.06 8l1.22-1.22a.75.75 0 10-1.06-1.06L8 6.94 6.78 5.72a.75.75 0 00-1.06 0z" />,
  },
}

export function Alert({ type, title, children, className = '' }: AlertProps) {
  const s = alertStyles[type]
  return (
    <div className={`flex gap-3 rounded-[var(--tcs-radius-md)] border px-4 py-3 text-sm ${s.wrap} ${className}`}>
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">{s.icon}</svg>
      <div>
        {title && <p className="mb-0.5 font-bold">{title}</p>}
        <p className="leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }
  const iconSizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${iconSizes[size]} flex shrink-0 items-center justify-center rounded-[var(--tcs-radius-md)] bg-[var(--tcs-brand-900)] shadow-[var(--tcs-shadow-sm)]`}>
        <svg viewBox="0 0 40 40" fill="none" className="h-4/5 w-4/5" aria-hidden="true">
          <path d="M10 25.5c0-5.52 4.48-10 10-10s10 4.48 10 10" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
          <circle cx="20" cy="13.5" r="4.2" fill="#9cc7ff" stroke="white" strokeWidth="2" />
          <path d="M8 29h24M12 33h16" stroke="#9cc7ff" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0">
        <div className={`display-font font-extrabold leading-none tracking-normal text-[var(--tcs-text)] ${textSizes[size]}`}>TCS</div>
        <div className="mt-0.5 truncate text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-[var(--tcs-text-muted)]">Thrift Core System</div>
      </div>
    </div>
  )
}

interface StepIndicatorProps {
  steps: { label: string; sublabel?: string }[]
  current: number
  completed: number[]
}

export function StepIndicator({ steps, current, completed }: StepIndicatorProps) {
  return (
    <ol className="flex flex-col gap-1">
      {steps.map((step, i) => {
        const done = completed.includes(i)
        const active = current === i
        return (
          <li key={step.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${done ? 'bg-[var(--tcs-success)] text-white' : active ? 'bg-[var(--tcs-brand)] text-white ring-4 ring-[rgba(21,84,192,0.14)]' : 'bg-[var(--tcs-surface-muted)] text-[var(--tcs-text-faint)]'}`}>
                {done ? (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 111.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                ) : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`mt-1 min-h-[20px] w-px flex-1 ${done ? 'bg-[var(--tcs-success)]' : 'bg-[var(--tcs-border)]'}`} />}
            </div>
            <div className="pb-4">
              <p className={`text-sm font-semibold leading-none ${active ? 'text-[var(--tcs-brand)]' : done ? 'text-[var(--tcs-success)]' : 'text-[var(--tcs-text-faint)]'}`}>{step.label}</p>
              {step.sublabel && <p className="mt-1 text-xs text-[var(--tcs-text-muted)]">{step.sublabel}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
