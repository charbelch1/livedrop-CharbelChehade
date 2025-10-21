import React from 'react'
import UserLogin from '../components/UserLogin'
import { useUser } from '../lib/user'
import { useNavigate } from '../lib/router'

const LoginPage: React.FC = () => {
  const setCustomer = useUser(s => s.setCustomer)
  const navigate = useNavigate()
  return (
    <div className="max-w-md mx-auto space-y-3">
      <h1 className="text-xl font-semibold">Identify Yourself</h1>
      <p className="text-sm text-zinc-500">Enter your email to look up your profile. Try demo@example.com after seeding.</p>
      <UserLogin onIdentified={(c) => { setCustomer(c); navigate('/checkout') }} />
    </div>
  )
}

export default LoginPage
