interface HighlighterProps {
  rect: DOMRect | null
  visible: boolean
}

export function Highlighter({ rect, visible }: HighlighterProps) {
  if (!visible || !rect) {
    return null
  }

  return (
    <div
      id="pixelpoint-highlighter"
      style={{
        position: 'fixed',
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        border: '2px solid #3b82f6',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 2147483646,
        transition: 'all 0.05s ease-out',
        boxSizing: 'border-box',
      }}
    />
  )
}
