import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import AuthNavigator from './navigation/AuthNavigator'
import AppNavigator from './navigation/AppNavigator'
import { authService } from './services/auth'
import { COLORS } from './utils/constants'

import api from './services/api'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      const token = await authService.getToken()

      if (currentUser && token) {
        // Validate token with backend
        try {
          await api.get('/auth/profile')
          setUser(currentUser)
        } catch (error) {
          console.log('Session invalid, logging out')
          await authService.logout()
          setUser(null)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (token, userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    await authService.logout()
    setUser(null)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {user ? (
        <AppNavigator user={user} onLogout={handleLogout} />
      ) : (
        <AuthNavigator onLogin={handleLogin} />
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
})

