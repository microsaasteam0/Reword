'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

const VerifyEmailContent = () => {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token')
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Verifying your email...')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('No verification token found. Please check your email link.')
            return
        }

        const verifyEmail = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-email?token=${token}`)
                if (response.data.success) {
                    setStatus('success')
                    setMessage(response.data.message || 'Email successfully verified!')
                    toast.success('Email verified successfully!')
                    // Redirect to home after 3 seconds
                    setTimeout(() => {
                        router.push('/')
                    }, 3000)
                } else {
                    setStatus('error')
                    setMessage(response.data.message || 'Verification failed. The link may have expired.')
                }
            } catch (error: any) {
                console.error('Verification error:', error)
                setStatus('error')
                setMessage(error.response?.data?.detail || 'Verification failed. The link may be invalid or expired.')
            }
        }

        verifyEmail()
    }, [token])

    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700"
            >
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                        <h2 className="text-2xl font-bold dark:text-white">Verifying your email</h2>
                        <p className="text-gray-600 dark:text-gray-400">Please wait while we confirm your account...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white">Email Verified!</h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                            You can now access all features of Reword.
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
                        >
                            Go to Homepage <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold dark:text-white">Verification Failed</h2>
                        <p className="text-gray-600 dark:text-gray-400">{message}</p>
                        <div className="flex flex-col gap-3 mt-6 w-full">
                            <Link
                                href="/"
                                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold rounded-xl transition-all"
                            >
                                Back to Home
                            </Link>
                            <button
                                onClick={() => router.push('/?auth=login')}
                                className="px-6 py-3 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                                Send new verification link?
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

export default function VerifyEmailPage() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
            <Navbar />
            <Suspense fallback={
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
            <Footer />
        </main>
    )
}
