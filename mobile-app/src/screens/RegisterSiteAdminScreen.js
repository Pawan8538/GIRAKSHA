import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { COLORS } from '../utils/constants'
import api from '../services/api'

import * as DocumentPicker from 'expo-document-picker'

export default function RegisterSiteAdminScreen({ navigation }) {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        mine_action: 'create', // 'create' or 'join'
        mine_name: '',
        mine_lat: '',
        mine_lng: '',
        mine_desc: '',
        existing_slope_id: ''
    })
    const [selectedFile, setSelectedFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [slopes, setSlopes] = useState([])

    useEffect(() => {
        fetchSlopes()
    }, [])

    const fetchSlopes = async () => {
        try {
            console.log('Fetching slopes from:', '/auth/slopes')
            const response = await api.get('/auth/slopes')
            console.log('Slopes response:', response.data)
            if (response.data.success) {
                setSlopes(response.data.data)
            }
        } catch (error) {
            console.error('Failed to fetch slopes:', error)
            Alert.alert('Error', 'Failed to load mines. Please check internet connection.')
        }
    }

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
        if (!form.name || !form.email || !form.phone || !form.password || !selectedFile) {
            Alert.alert('Validation Error', 'Please fill all required fields and upload Company ID')
            return
        }

        if (form.mine_action === 'create' && (!form.mine_name || !form.mine_lat || !form.mine_lng)) {
            Alert.alert('Validation Error', 'Please fill all mine details')
            return
        }

        if (form.mine_action === 'join' && !form.existing_slope_id) {
            Alert.alert('Validation Error', 'Please select an existing Mine')
            return
        }

        setLoading(true)
        try {
            const payload = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                password: form.password,
                company_id_url: 'https://example.com/mock-company-id.jpg',
                mine_action: form.mine_action,
                mine_details: form.mine_action === 'create' ? {
                    name: form.mine_name,
                    lat: parseFloat(form.mine_lat),
                    lng: parseFloat(form.mine_lng),
                    description: form.mine_desc
                } : {
                    existing_slope_id: parseInt(form.existing_slope_id)
                }
            }

            await api.post('/auth/register/site-admin', payload)
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

    const isFormValid = form.name && form.email && form.phone && form.password && selectedFile &&
        (form.mine_action === 'create' ? (form.mine_name && form.mine_lat && form.mine_lng) : form.existing_slope_id)

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Site Admin Registration</Text>
            <Text style={styles.subtitle}>Manage your mine site</Text>

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
                    placeholder="Password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                    value={form.password}
                    onChangeText={t => setForm({ ...form, password: t })}
                />

                <View style={styles.switchContainer}>
                    <TouchableOpacity
                        style={[styles.switchBtn, form.mine_action === 'create' && styles.switchBtnActive]}
                        onPress={() => setForm({ ...form, mine_action: 'create' })}
                    >
                        <Text style={[styles.switchText, form.mine_action === 'create' && styles.switchTextActive]}>Create New Mine</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.switchBtn, form.mine_action === 'join' && styles.switchBtnActive]}
                        onPress={() => setForm({ ...form, mine_action: 'join' })}
                    >
                        <Text style={[styles.switchText, form.mine_action === 'join' && styles.switchTextActive]}>Join Existing</Text>
                    </TouchableOpacity>
                </View>

                {form.mine_action === 'create' ? (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Mine Name"
                            placeholderTextColor={COLORS.textSecondary}
                            value={form.mine_name}
                            onChangeText={t => setForm({ ...form, mine_name: t })}
                        />
                        <View style={styles.row}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Latitude"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="numeric"
                                value={form.mine_lat}
                                onChangeText={t => setForm({ ...form, mine_lat: t })}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Longitude"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="numeric"
                                value={form.mine_lng}
                                onChangeText={t => setForm({ ...form, mine_lng: t })}
                            />
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Description (Optional)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={form.mine_desc}
                            onChangeText={t => setForm({ ...form, mine_desc: t })}
                        />
                    </>
                ) : (
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={form.existing_slope_id}
                            onValueChange={(itemValue) => setForm({ ...form, existing_slope_id: itemValue })}
                            style={styles.picker}
                            dropdownIconColor={COLORS.text}
                            mode="dropdown"
                        >
                            <Picker.Item label="Select a Mine" value="" color={COLORS.textSecondary} style={{ backgroundColor: COLORS.surface }} />
                            {slopes.map((slope) => (
                                <Picker.Item
                                    key={slope.id}
                                    label={slope.name}
                                    value={slope.id}
                                    color={COLORS.text}
                                    style={{ backgroundColor: COLORS.surface }}
                                />
                            ))}
                        </Picker>
                    </View>
                )}

                <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                    <Text style={styles.uploadText}>
                        {selectedFile ? `Selected: ${selectedFile.name}` : 'Upload Company ID (PDF/JPG)'}
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
        gap: 16,
        paddingBottom: 40
    },
    input: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.border
    },
    pickerContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden'
    },
    picker: {
        color: COLORS.text
    },
    row: {
        flexDirection: 'row',
        gap: 16
    },
    switchContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 4,
        marginBottom: 8
    },
    switchBtn: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderRadius: 8
    },
    switchBtnActive: {
        backgroundColor: COLORS.primary
    },
    switchText: {
        color: COLORS.textSecondary,
        fontWeight: '600'
    },
    switchTextActive: {
        color: '#fff'
    },
    uploadBtn: {
        padding: 20,
        borderWidth: 2,
        borderColor: COLORS.accent,
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: 'rgba(56, 189, 248, 0.1)'
    },
    uploadText: {
        color: COLORS.accent,
        fontWeight: 'bold',
        fontSize: 16
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
