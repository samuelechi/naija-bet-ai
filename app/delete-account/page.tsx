export default function DeleteAccount() {
    const cardStyle = {
        background: '#111118',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
    }

    const dotRed = {
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: '#ef4444',
        flexShrink: 0 as const,
    }

    const dotYellow = {
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: '#eab308',
        flexShrink: 0 as const,
    }

    const btnStyle = {
        display: 'block',
        textAlign: 'center' as const,
        padding: '12px',
        borderRadius: '12px',
        color: 'white',
        fontWeight: 900,
        fontSize: '14px',
        textDecoration: 'none',
        background: '#16a34a',
    }

    const deleted = [
        'Your account and login credentials',
        'Your prediction history',
        'Your profile information',
        'Your subscription data',
    ]

    const retained = [
        'Transaction records (required by law for up to 7 years)',
        'Anonymised usage data for analytics',
    ]

    return (
        <main style={{ background: '#0A0A0F', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px' }}>
            <div style={{ width: '100%', maxWidth: '448px' }}>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #166534, #15803d)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        ⚽
                    </div>
                    <h1 style={{ color: 'white', fontWeight: 900, fontSize: '24px', marginBottom: '8px' }}>Delete Your Account</h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                        We're sorry to see you go. Please read below before requesting deletion.
                    </p>
                </div>

                <div style={cardStyle}>
                    <h2 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>🗑️ What will be deleted</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {deleted.map(item => (
                            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                                <div style={dotRed} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={cardStyle}>
                    <h2 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>📋 What may be retained</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {retained.map(item => (
                            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>
                                <div style={dotYellow} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ ...cardStyle, marginBottom: '32px' }}>
                    <h2 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>⏱️ Deletion timeline</h2>
                    <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: '1.6', margin: 0 }}>
                        Your account and data will be permanently deleted within <strong style={{ color: 'white' }}>30 days</strong> of your request.
                    </p>
                </div>

                <div style={{ background: 'linear-gradient(135deg, #166534, #14532d)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                    <h2 style={{ color: 'white', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>📧 How to request deletion</h2>
                    <p style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.6', marginBottom: '12px' }}>
                        Send an email with subject <strong style={{ color: 'white' }}>"Delete My Account"</strong> from your registered email address.
                    </p>
                    <a href="mailto:naijabetai@gmail.com?subject=Delete My Account" style={btnStyle}>
                        📧 naijabetai@gmail.com
                    </a>
                </div>

                <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '12px' }}>
                    NaijaBetAI · naijabetai.com
                </p>

            </div>
        </main>
    )
}