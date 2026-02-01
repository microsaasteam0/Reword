import { Metadata } from 'next'
import TermsContent from './TermsContent'

export const metadata: Metadata = {
    title: 'Terms of Service | Reword',
    description: 'The terms and conditions for using the Reword AI platform.',
    openGraph: {
        title: 'Terms of Service | Reword',
        description: 'The terms and conditions for using the Reword AI platform.',
    }
}

export default function TermsPage() {
    return <TermsContent />
}
