import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { MEDIA_MAX_SIZE_MB } from '../utils/constants'

export default function UploadBox({ onPick }) {
  const [preview, setPreview] = useState(null)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      alert('Camera permission is required.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    })

    if (!result.canceled) {
      const asset = result.assets[0]
      const info = await FileSystem.getInfoAsync(asset.uri)
      const sizeMb = info.size / (1024 * 1024)
      if (sizeMb > MEDIA_MAX_SIZE_MB) {
        alert(`File limit is ${MEDIA_MAX_SIZE_MB}MB`)
        return
      }
      setPreview(asset.uri)
      onPick?.(asset)
    }
  }

  return (
    <Pressable style={styles.box} onPress={pickImage}>
      {preview ? <Image source={{ uri: preview }} style={styles.preview} /> : <Text style={styles.label}>Tap to capture evidence</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderColor: '#64748b',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  label: {
    color: '#94a3b8',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
})

