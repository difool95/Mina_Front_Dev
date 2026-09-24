import { useCustomerCredits } from '@/hooks/useCustomerCredits'
import { useAuth } from '@/providers/AuthProvider'

import './RoleTagCard.css'

const ROLE_LABELS = { business: 'Business', admin: 'Admin' } as const

/** The role tag beside the header logo, shown to business and admin accounts. */
export function RoleTagCard() {
  const { session } = useAuth()
  const { data: customer } = useCustomerCredits(session?.user.id)

  if (customer?.mg_role !== 'business' && customer?.mg_role !== 'admin') return null

  return <span className="mina-role-tag">{ROLE_LABELS[customer.mg_role]}</span>
}
