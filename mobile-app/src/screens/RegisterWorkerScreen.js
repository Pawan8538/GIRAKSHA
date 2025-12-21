import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { COLORS } from '../utils/constants'
import api from '../services/api'

export default function RegisterWorkerScreen({ navigation }) {
    const [step, setStep] = useState(1) // 1: Phone, 2: OTP & Details
    const [form, setForm] = useState({
        phone: '',
        otp: '',
        name: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)

    const handleVerifyPhone = async () => {
        // In a real app, we'd check if phone is invited here.
        // For now, we just move to next step assuming backend will validate on final submit
        // Or we could have a check-invite endpoint.
        if (!form.phone) {
            Alert.alert('Error', 'Phone number is required')
            return
        }
        setStep(2)
        Alert.alert('OTP Sent', 'Use 123456 as OTP')
    }

    const handleRegister = async () => {
        if (!form.name || !form.password || !form.otp) {
            Alert.alert('Error', 'Please fill all fields')
            return
        }

        setLoading(true)
        try {
            const res = await api.post('/auth/register/worker', form)
            // Auto-login or navigate to login
            Alert.alert(
                'Success',
                'Registration successful! You can now log in.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            )
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Field Worker Registration</Text>
            <Text style={styles.subtitle}>Enter your details to join your team</Text>

            <View style={styles.form}>
                {step === 1 ? (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="phone-pad"
                            value={form.phone}
                            onChangeText={t => setForm({ ...form, phone: t })}
                        />
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleVerifyPhone}
                        >
                            <Text style={styles.buttonText}>Send OTP</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter OTP (123456)"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="numeric"
                            value={form.otp}
                            onChangeText={t => setForm({ ...form, otp: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor={COLORS.textSecondary}
                            value={form.name}
                            onChangeText={t => setForm({ ...form, name: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Set Password"
                            placeholderTextColor={COLORS.textSecondary}
                            secureTextEntry
                            value={form.password}
                            onChangeText={t => setForm({ ...form, password: t })}
                        />
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Complete Registration</Text>}
                        </TouchableOpacity>
                    </>
                )}
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
