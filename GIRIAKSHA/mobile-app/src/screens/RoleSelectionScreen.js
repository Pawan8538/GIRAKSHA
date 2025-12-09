import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { COLORS } from '../utils/constants'

export default function RoleSelectionScreen({ navigation }) {
    const roles = [
        {
            id: 'worker',
            title: 'Field Worker',
            description: 'Join a mine via invite code',
            icon: '👷',
            route: 'RegisterWorker'
        },
        {
            id: 'admin',
            title: 'Site Admin',
            description: 'Manage a mine site',
            icon: '🏗️',
            route: 'RegisterSiteAdmin'
        },
        {
            id: 'gov',
            title: 'Govt Authority',
            description: 'Monitor compliance & alerts',
            icon: '🏛️',
            route: 'RegisterGov'
        }
    ]

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Select Your Role</Text>
                <Text style={styles.subtitle}>Choose how you want to use GeoGuard</Text>
            </View>

            <View style={styles.grid}>
                {roles.map((role) => (
                    <TouchableOpacity
                        key={role.id}
                        style={styles.card}
                        onPress={() => navigation.navigate('Login', {
                            roleId: role.id,
                            roleName: role.title,
                            registerRoute: role.route
                        })}
                    >
                        <Text style={styles.icon}>{role.icon}</Text>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>{role.title}</Text>
                            <Text style={styles.cardDesc}>{role.description}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
            >
                <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Log In</Text></Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 24,
        justifyContent: 'center'
    },
    header: {
        marginBottom: 40,
        alignItems: 'center'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text, // Fixed: Was COLORS.primary (dark on dark)
        marginBottom: 8
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary
    },
    grid: {
        gap: 16
    },
    card: {
        backgroundColor: COLORS.surface,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    textContainer: {
        flex: 1
    },
    icon: {
        fontSize: 32
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4
    },
    cardDesc: {
        fontSize: 14,
        color: COLORS.textSecondary
    },
    loginLink: {
        marginTop: 40,
        alignItems: 'center'
    },
    loginText: {
        color: COLORS.textSecondary,
        fontSize: 14
    },
    loginBold: {
        color: COLORS.accent, // Fixed: Was COLORS.primary
        fontWeight: 'bold'
    }
})
