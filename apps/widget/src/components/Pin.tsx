interface PinProps {
  number: number
  x: number
  y: number
  onClick?: () => void
}

export function Pin({ number, x, y, onClick }: PinProps) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: '700',
        boxShadow: '0 2px 8px rgba(219, 39, 119, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        zIndex: 2147483645,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
      onMouseEnter={(e) => {
        const target = e.currentTarget as HTMLElement
        target.style.transform = 'translate(-50%, -50%) scale(1.15)'
        target.style.boxShadow = '0 4px 12px rgba(219, 39, 119, 0.5), 0 2px 4px rgba(0, 0, 0, 0.15)'
      }}
      onMouseLeave={(e) => {
        const target = e.currentTarget as HTMLElement
        target.style.transform = 'translate(-50%, -50%) scale(1)'
        target.style.boxShadow = '0 2px 8px rgba(219, 39, 119, 0.4), 0 1px 3px rgba(0, 0, 0, 0.1)'
      }}
    >
      {number}
    </div>
  )
}
