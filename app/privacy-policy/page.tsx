export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen px-5 py-14 max-w-2xl mx-auto" style={{ background: '#0A0A0F' }}>
            <h1 className="text-white text-2xl font-black mb-2 font-display">Privacy Policy</h1>
            <p className="text-slate-500 text-xs mb-8">Last updated: April 3, 2026</p>

            {[
                {
                    title: '1. Information We Collect',
                    content: 'We collect your email address and name when you create an account. We also collect usage data such as predictions viewed and betting history within the app.'
                },
                {
                    title: '2. How We Use Your Information',
                    content: 'We use your information to provide AI-powered football predictions, manage your subscription, send push notifications about predictions and results, and improve our service.'
                },
                {
                    title: '3. Payment Information',
                    content: 'Payments are processed securely by Paystack and Stripe. We do not store your card details. We only store your subscription status and expiry date.'
                },
                {
                    title: '4. Push Notifications',
                    content: 'With your permission, we send push notifications for daily predictions, match results, and subscription reminders. You can opt out at any time through your device settings.'
                },
                {
                    title: '5. Data Sharing',
                    content: 'We do not sell your personal data to third parties. We share data only with service providers necessary to operate the app (Supabase for database, OneSignal for notifications, Paystack and Stripe for payments).'
                },
                {
                    title: '6. Data Retention',
                    content: 'We retain your account data for as long as your account is active. You may request deletion of your account and data by contacting us.'
                },
                {
                    title: '7. Security',
                    content: 'We use industry-standard security measures to protect your data. All data is encrypted in transit and at rest.'
                },
                {
                    title: '8. Children\'s Privacy',
                    content: 'NaijaBetAI is not intended for users under the age of 18. We do not knowingly collect data from minors.'
                },
                {
                    title: '9. Changes to This Policy',
                    content: 'We may update this privacy policy from time to time. We will notify you of significant changes via email or push notification.'
                },
                {
                    title: '10. Contact Us',
                    content: 'If you have any questions about this privacy policy, please contact us at support@naijabetai.com.'
                },
            ].map((section, i) => (
                <div key={i} className="mb-6">
                    <h2 className="text-white font-bold text-sm mb-2">{section.title}</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">{section.content}</p>
                </div>
            ))}

            <div className="mt-10 pt-6 border-t border-white/10">
                <p className="text-slate-600 text-xs">© 2026 NaijaBetAI. All rights reserved.</p>
            </div>
        </main>
    )
}