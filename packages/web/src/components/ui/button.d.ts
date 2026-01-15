import { ReactNode, ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
  variant?: 'default' | 'outline' | 'success' | 'error' | 'ghost' | 'passion' | 'kawaii'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export function Button(props: ButtonProps): JSX.Element

export default Button
