import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, Modal } from 'react-native'
import { COLORS } from '../utils/constants'
import api from '../services/api'
import { Ionicons } from '@expo/vector-icons'

export default function WorkerManagementScreen() {
    const [workers, setWorkers] = useState([])
    const [loading, setLoading] = useState(true)
    const [inviteModalVisible, setInviteModalVisible] = useState(false)
    const [invitePhone, setInvitePhone] = useState('')

    useEffect(() => {
        loadWorkers()
    }, [])

    const loadWorkers = async () => {
        setLoading(true)
        try {
            const res = await api.get('/auth/workers')
            setWorkers(res.data.data)
        } catch (error) {
            console.error(error)
            Alert.alert('Error', 'Failed to load workers')
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async () => {
        if (!invitePhone) {
            Alert.alert('Error', 'Please enter a phone number')
            return
        }
        try {
            await api.post('/auth/invite/worker', { phone: invitePhone })
            Alert.alert('Success', 'Invitation sent!')
            setInviteModalVisible(false)
            setInvitePhone('')
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send invite')
        }
    }

    const handleDelete = (workerId, workerName) => {
        Alert.alert(
            'Delete Worker',
            `Are you sure you want to remove ${workerName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/auth/admin/worker/${workerId}`)
                            Alert.alert('Success', 'Worker removed')
                            loadWorkers()
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete worker')
                        }
                    }
                }
            ]
        )
    }

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.[0] || 'W'}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
                <Text style={styles.status}>{item.is_approved ? 'Active' : 'Pending'}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={24} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    )

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Field Workers</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setInviteModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.addBtnText}>Invite</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={workers}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadWorkers} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No workers found</Text>
                    </View>
                }
            />

            <Modal
                visible={inviteModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setInviteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Invite Worker</Text>
                        <Text style={styles.modalSubtitle}>Enter phone number to invite</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor={COLORS.textSecondary}
                            keyboardType="phone-pad"
                            value={invitePhone}
                            onChangeText={setInvitePhone}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setInviteModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
                                <Text style={styles.inviteText}>Send Invite</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 16
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text
    },
    addBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        paddingHorizontal: 16,
        borderRadius: 20
    },
    addBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 4
    },
    card: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary
    },
    info: {
        flex: 1
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text
    },
    phone: {
        color: COLORS.textSecondary,
        fontSize: 14
    },
    status: {
        color: COLORS.success,
        fontSize: 12,
        marginTop: 2
    },
    empty: {
        padding: 40,
        alignItems: 'center'
    },
    emptyText: {
        color: COLORS.textSecondary
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        padding: 24,
        borderRadius: 16
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 8
    },
    modalSubtitle: {
        color: COLORS.textSecondary,
        marginBottom: 16
    },
    input: {
        backgroundColor: COLORS.background,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        color: COLORS.text,
        marginBottom: 24
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16
    },
    cancelBtn: {
        padding: 12
    },
    cancelText: {
        color: COLORS.textSecondary,
        fontWeight: '600'
    },
    inviteBtn: {
        backgroundColor: COLORS.primary,
        padding: 12,
        paddingHorizontal: 24,
        borderRadius: 8
    },
    inviteText: {
        color: '#fff',
        fontWeight: 'bold'
    }
})
