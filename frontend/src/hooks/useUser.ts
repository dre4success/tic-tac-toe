import { useState, useEffect, useCallback } from 'react'
import type { User } from '../lib/types'
import { api, ApiError } from '../lib/api'

const USER_STORAGE_KEY = 'tictactoe_user'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User
        // Verify user still exists on server
        api
          .getUser(parsed.id)
          .then((user) => {
            setUser(user)
            setIsLoading(false)
          })
          .catch(() => {
            localStorage.removeItem(USER_STORAGE_KEY)
            setIsLoading(false)
          })
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY)
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  // Create a new user
  const register = useCallback(async (username: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const newUser = await api.createUser(username)
      setUser(newUser)
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser))
      return newUser
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to create user')
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Login with existing username (or create if doesn't exist)
  const login = useCallback(
    async (username: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const existingUser = await api.getUserByUsername(username)
        setUser(existingUser)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(existingUser))
        return existingUser
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          return register(username)
        }
        if (err instanceof ApiError) {
          setError(err.message)
        } else {
          setError('Failed to login')
        }
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [register]
  )

  // Logout
  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(USER_STORAGE_KEY)
  }, [])

  return {
    user,
    isLoading,
    error,
    register,
    login,
    logout,
    clearError: () => setError(null),
  }
}
