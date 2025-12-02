'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { Logo } from '@/components/ui/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // TODO: Implement Supabase password reset
      toast({
        title: "Password reset placeholder",
        description: "Supabase auth integration pending"
      })
      setSent(true)
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0a0e27] to-[#1a1147] p-4">
      <Card className="w-full max-w-md border-white/10 bg-[#0a0e27]/50 backdrop-blur-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo variant="icon" className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl text-white">Reset password</CardTitle>
          <CardDescription className="text-gray-400">
            {sent ? "Check your email" : "Enter your email to reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-400">
                We've sent a password reset link to <strong className="text-white">{email}</strong>
              </p>
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full text-gray-400 hover:text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
