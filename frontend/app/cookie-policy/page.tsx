import { Metadata } from 'next'
import CookieContent from './CookieContent'

export const metadata: Metadata = {
    title: 'Cookie Policy | Reword',
    description: 'Information about how Reword uses cookies and similar technologies.',
    openGraph: {
        title: 'Cookie Policy | Reword',
        description: 'Information about how Reword uses cookies and similar technologies.',
    }
}

export default function CookiePage() {
    return <CookieContent />
}
