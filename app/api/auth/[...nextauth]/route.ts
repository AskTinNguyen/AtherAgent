import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is a simple demo authentication
        // In production, you should validate against a real database
        if (credentials?.username === "demo" && credentials?.password === "demo") {
          return {
            id: "1",
            name: "Demo User",
            email: "demo@example.com"
          }
        }
        return null
      }
    })
  ],
  // Simple configuration for development
  pages: {
    signIn: '/auth/signin' // Custom sign-in page (optional)
  }
})

export { handler as GET, handler as POST }
