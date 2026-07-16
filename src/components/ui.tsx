import { type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

// ── Button ──────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#1746A2] text-white hover:bg-[#143d8f] active:bg-[#102f6e]',
  secondary: 'bg-[#EEF2FF] text-[#1746A2] hover:bg-[#E0E8FF] border border-[#C7D2FE]',
  ghost: 'bg-transparent text-[#6B7280] hover:bg-[#F1F3F8] hover:text-[#0D1117]',
  danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C]',
  success: 'bg-[#059669] text-white hover:bg-[#047857]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-[10px]',
  lg: 'px-6 py-3 text-base rounded-[10px]',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1746A2] focus-visible:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  )
}

// ── Form Field ───────────────────────────────────────────────────────────────

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
      <label className="text-sm font-semibold text-[#0D1117]">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[#6B7280]">{hint}</p>}
      {error && (
        <p className="text-xs text-[#DC2626] flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.25a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3zm.75 6.5a.875.875 0 110-1.75.875.875 0 010 1.75z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
}

export function Input({ error, prefix, suffix, className = '', ...props }: InputProps) {
  const base = `w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1746A2] focus:border-transparent`
  const borderColor = error ? 'border-[#DC2626]' : 'border-[#E2E6F0]'
  if (prefix || suffix) {
    return (
      <div className={`flex items-center w-full bg-white border rounded-[10px] overflow-hidden transition-colors focus-within:ring-2 focus-within:ring-[#1746A2] focus-within:border-transparent ${error ? 'border-[#DC2626]' : 'border-[#E2E6F0]'}`}>
        {prefix && <span className="pl-3.5 pr-2 text-[#6B7280] shrink-0">{prefix}</span>}
        <input className={`flex-1 py-2.5 pr-3.5 text-sm bg-transparent text-[#0D1117] placeholder:text-[#9CA3AF] focus:outline-none ${prefix ? '' : 'pl-3.5'} ${className}`} {...props} />
        {suffix && <span className="pr-3.5 pl-2 text-[#6B7280] shrink-0">{suffix}</span>}
      </div>
    )
  }
  return <input className={`${base} ${borderColor} ${className}`} {...props} />
}

// ── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  children: ReactNode
}

export function Select({ error, children, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] text-[#0D1117] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1746A2] focus:border-transparent appearance-none cursor-pointer ${error ? 'border-[#DC2626]' : 'border-[#E2E6F0]'} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

// ── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-[10px] text-[#0D1117] placeholder:text-[#9CA3AF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1746A2] focus:border-transparent resize-none ${error ? 'border-[#DC2626]' : 'border-[#E2E6F0]'} ${className}`}
      {...props}
    />
  )
}

// ── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const padMap = { sm: 'p-4', md: 'p-6', lg: 'p-8' }
  return (
    <div className={`bg-white rounded-xl border border-[#E2E6F0] shadow-sm ${padMap[padding]} ${className}`}>
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'not-started' | 'pending' | 'verified' | 'rejected' | 'info'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

const badgeStyles: Record<BadgeVariant, string> = {
  'not-started': 'bg-[#F3F4F6] text-[#6B7280]',
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  verified: 'bg-[#D1FAE5] text-[#065F46]',
  rejected: 'bg-[#FEE2E2] text-[#991B1B]',
  info: 'bg-[#DBEAFE] text-[#1E40AF]',
}

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeStyles[variant]}`}>
      {variant === 'verified' && <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />}
      {variant === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />}
      {variant === 'rejected' && <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />}
      {variant === 'not-started' && <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />}
      {children}
    </span>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-[#E2E6F0] my-4" />
  return (
    <div className="flex items-center gap-3 my-4">
      <hr className="flex-1 border-[#E2E6F0]" />
      <span className="text-xs text-[#9CA3AF] font-medium">{label}</span>
      <hr className="flex-1 border-[#E2E6F0]" />
    </div>
  )
}

// ── Alert ─────────────────────────────────────────────────────────────────────

type AlertType = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  type: AlertType
  title?: string
  children: ReactNode
  className?: string
}

const alertStyles: Record<AlertType, { wrap: string; icon: string }> = {
  info: { wrap: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]', icon: 'ℹ️' },
  success: { wrap: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]', icon: '✓' },
  warning: { wrap: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]', icon: '⚠' },
  error: { wrap: 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]', icon: '✕' },
}

export function Alert({ type, title, children, className = '' }: AlertProps) {
  const s = alertStyles[type]
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${s.wrap} ${className}`}>
      {title && <p className="font-semibold mb-0.5">{title}</p>}
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}

// ── Logo ───────────────────────────────────────────────────────────────────────

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }
  const iconSizes = { sm: 'w-7 h-7', md: 'w-9 h-9', lg: 'w-11 h-11' }
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${iconSizes[size]} rounded-xl bg-[#1746A2] flex items-center justify-center shrink-0`}>
        <svg viewBox="0 0 36 36" fill="none" className="w-5/6 h-5/6">
          <path d="M10 22c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="18" cy="13" r="4" fill="white" fillOpacity=".25" stroke="white" strokeWidth="2" />
          <path d="M6 28h24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity=".4" />
          <circle cx="9" cy="10" r="2.5" fill="#7DD3FC" />
          <circle cx="27" cy="10" r="2.5" fill="#7DD3FC" />
        </svg>
      </div>
      <div>
        <div className={`display-font font-800 leading-none text-[#0D1117] ${sizes[size]}`}>TCS</div>
        <div className="text-[10px] text-[#6B7280] font-medium tracking-wide uppercase leading-none mt-0.5">Thrift Core System</div>
      </div>
    </div>
  )
}

// ── Step Indicator ─────────────────────────────────────────────────────────────

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
          <li key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${done ? 'bg-[#059669] text-white' : active ? 'bg-[#1746A2] text-white ring-4 ring-[#C7D2FE]' : 'bg-[#F1F3F8] text-[#9CA3AF]'}`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                  </svg>
                ) : i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-px flex-1 min-h-[20px] mt-1 ${done ? 'bg-[#059669]' : 'bg-[#E2E6F0]'}`} />}
            </div>
            <div className="pb-4">
              <p className={`text-sm font-semibold leading-none ${active ? 'text-[#1746A2]' : done ? 'text-[#059669]' : 'text-[#9CA3AF]'}`}>{step.label}</p>
              {step.sublabel && <p className="text-xs text-[#9CA3AF] mt-0.5">{step.sublabel}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
