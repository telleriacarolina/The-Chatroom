import { ReactNode, ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'success' | 'error'
  size?: 'sm' | 'md' | 'lg'
}

export function Button(props: ButtonProps): JSX.Element

export default Button
