export function AndroidLogo({ size = 40 }: { size?: number }) {
    return (
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
            {/* Antennas */}
            <line x1="72" y1="62" x2="55" y2="40" stroke="#3DDC84" strokeWidth="6" strokeLinecap="round" />
            <line x1="128" y1="62" x2="145" y2="40" stroke="#3DDC84" strokeWidth="6" strokeLinecap="round" />
            {/* Head */}
            <path d="M55 95 A45 45 0 0 1 145 95 Z" fill="#3DDC84" />
            {/* Eyes */}
            <circle cx="80" cy="80" r="5" fill="white" />
            <circle cx="120" cy="80" r="5" fill="white" />
            {/* Body */}
            <rect x="45" y="98" width="110" height="70" rx="10" fill="#3DDC84" />
            {/* Left arm */}
            <rect x="25" y="98" width="16" height="55" rx="8" fill="#3DDC84" />
            {/* Right arm */}
            <rect x="159" y="98" width="16" height="55" rx="8" fill="#3DDC84" />
            {/* Left leg */}
            <rect x="62" y="168" width="16" height="30" rx="8" fill="#3DDC84" />
            {/* Right leg */}
            <rect x="122" y="168" width="16" height="30" rx="8" fill="#3DDC84" />
        </svg>
    )
}