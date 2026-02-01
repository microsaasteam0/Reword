import { Metadata } from 'next'
import PrivacyContent from './PrivacyContent'

export const metadata: Metadata = {
    title: 'Privacy Policy | Reword',
    description: 'How Reword handles and protects your personal data.',
    openGraph: {
        title: 'Privacy Policy | Reword',
        description: 'How Reword handles and protects your personal data.',
    }
}

export default function PrivacyPage() {
    return <PrivacyContent />
}
