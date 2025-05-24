export const metadata = {
  title: 'Login - KitchenIntel',
  description: 'Sign in to access your restaurant dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div suppressHydrationWarning={true}>{children}</div>
  )
}
