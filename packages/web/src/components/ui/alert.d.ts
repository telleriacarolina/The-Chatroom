import { ReactNode, CSSProperties } from 'react'

export interface AlertProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  variant?: 'default' | 'success' | 'error' | 'warning'
}

export interface AlertDescriptionProps {
  children: ReactNode
  className?: string
}

export function Alert(props: AlertProps): JSX.Element
export function AlertDescription(props: AlertDescriptionProps): JSX.Element

export default Alert
