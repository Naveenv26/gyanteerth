const Logo = ({ showTagline = true, className = '', scale = 1, isDark = false }) => (
  <div className={`flex flex-col items-start justify-center ${className}`} style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', fontFamily: 'system-ui, sans-serif', fontWeight: 800, letterSpacing: '-0.02em' }}>
      <span style={{ color: '#10b981', fontSize: '2.4rem', lineHeight: '0.8', marginRight: '1px' }}>g</span>
      <span style={{ color: '#10b981', fontSize: '1.8rem' }}>yan</span>
      <span style={{ color: '#f97316', fontSize: '1.8rem' }}>teerth</span>
    </div>
    {showTagline && (
      <span 
        style={{ 
          fontSize: '0.65rem', 
          color: isDark ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)', 
          fontWeight: 800, 
          letterSpacing: '0.05em', 
          marginTop: '4px', 
          textTransform: 'uppercase' 
        }}
      >
        Committed towards excellence...
      </span>
    )}
  </div>
);

export default Logo;
