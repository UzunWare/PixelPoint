import { createContext } from 'preact'
import { useContext } from 'preact/hooks'

export interface WidgetConfig {
  projectId: string | null
}

export const WidgetContext = createContext<WidgetConfig>({
  projectId: null,
})

export function useWidgetConfig() {
  return useContext(WidgetContext)
}
