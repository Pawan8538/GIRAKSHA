import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { COLORS } from '../utils/constants'
import api from '../services/api'

import * as DocumentPicker from 'expo-document-picker'

export default function RegisterGovScreen({ navigation }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        department: '',
    })
    const [selectedFile, setSelectedFile] = useState(null)
    const [loading, setLoading] = useState(false)

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            })

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0])
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document')
        }
    }

    const handleRegister = async () => {
        if (!form.name || !form.email || !form.phone || !form.password || !form.department || !selectedFile) {
            Alert.alert('Validation Error', 'Please fill all required fields and upload your Govt ID.')
            return
        }

        setLoading(true)
        try {
            // In a real app, we would upload the file first or use FormData
            // For this prototype, we'll mock the URL but enforce the UI selection
            await api.post('/auth/register/gov', {
                ...form,
                govt_id_url: 'https://example.com/mock-id-uploaded.jpg'
            })
            Alert.alert(
                'Success',
                'Registration submitted! Please wait for Super Admin approval.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            )
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const isFormValid = form.name && form.email && form.phone && form.password && form.department && selectedFile

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Govt Authority Registration</Text>
            <Text style={styles.subtitle}>Join as a regulatory authority</Text>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={COLORS.textSecondary}
                    value={form.name}
                    onChangeText={t => setForm({ ...form, name: t })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="none"
                    value={form.email}
                    onChangeText={t => setForm({ ...form, email: t })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={COLORS.textSecondary}
                    keyboardType="phone-pad"
                    value={form.phone}
                    onChangeText={t => setForm({ ...form, phone: t })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Department / Agency"
                    placeholderTextColor={COLORS.textSecondary}
                    value={form.department}
                    onChangeText={t => setForm({ ...form, department: t })}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                    value={form.password}
                    onChangeText={t => setForm({ ...form, password: t })}
                />

                <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                    <Text style={styles.uploadText}>
                        {selectedFile ? `Selected: ${selectedFile.name}` : 'Upload Govt ID (PDF/JPG)'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, (!isFormValid || loading) && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={!isFormValid || loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit for Approval</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 24
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8,
        marginTop: 40
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginBottom: 32
    },
    form: {
        gap: 16
    },
    input: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    uploadBtn: {
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16
    },
    uploadText: {
        color: COLORS.primary
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8
    },
    buttonDisabled: {
        opacity: 0.7
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    }
})
