import { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import { complaintsService } from '../services/api'
import UploadBox from '../components/UploadBox'
import { useNetwork } from '../hooks/useNetwork'
import { enqueueComplaint } from '../services/offlineQueue'
import { COLORS } from '../utils/constants'

export default function ComplaintScreen() {
  const [description, setDescription] = useState('')
  const [media, setMedia] = useState(null)
  const { isOnline } = useNetwork()

  const handleSubmit = async () => {
    if (!description) {
      Alert.alert('Validation', 'Description is required')
      return
    }

    const payload = {
      description,
      attachment: media,
    }

    try {
      if (isOnline) {
        await complaintsService.create(payload)
        Alert.alert('Success', 'Complaint sent to control room.')
      } else {
        await enqueueComplaint(payload)
        Alert.alert('Offline', 'Complaint stored locally and will sync later.')
      }
      setDescription('')
      setMedia(null)
    } catch (error) {
      console.error('Complaint failed', error)
      Alert.alert('Error', 'Could not submit complaint.')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Rockfall / Hazard</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe the issue"
        placeholderTextColor="#64748b"
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <UploadBox onPick={setMedia} />
      <Text style={styles.button} onPress={handleSubmit}>
        Submit complaint ({isOnline ? 'online' : 'queued'})
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
    padding: 16,
    gap: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  input: {
    minHeight: 160,
    borderRadius: 12,
    borderColor: '#1f2937',
    borderWidth: 1,
    padding: 12,
    color: '#fff',
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 8,
    backgroundColor: COLORS.accent,
    color: '#0f172a',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    fontWeight: '600',
  },
})

