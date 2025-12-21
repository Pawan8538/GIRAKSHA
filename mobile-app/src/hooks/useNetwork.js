import { useEffect, useState } from 'react'
import * as Network from 'expo-network'

export const useNetwork = (intervalMs = 5000) => {
  const [isOnline, setIsOnline] = useState(true)
  const [type, setType] = useState('unknown')

  useEffect(() => {
    let mounted = true
    let timer

    const poll = async () => {
      try {
        const state = await Network.getNetworkStateAsync()
        if (!mounted) return
        setIsOnline(state.isConnected && state.isInternetReachable)
        setType(state.type || 'unknown')
      } catch (error) {
        console.warn('Network check failed', error)
        if (mounted) setIsOnline(false)
      }
    }

    poll()
    timer = setInterval(poll, intervalMs)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [intervalMs])

  return { isOnline, type }
}

