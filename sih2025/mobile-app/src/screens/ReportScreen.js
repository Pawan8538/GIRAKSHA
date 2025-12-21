import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../theme';

export default function ReportScreen({ navigation }) {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!description.trim()) {
            Alert.alert('Error', 'Please describe the hazard');
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            Alert.alert('Success', 'Hazard reported successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Report Hazard</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>Upload Photo</Text>
                    <TouchableOpacity style={styles.uploadBox} onPress={() => Alert.alert('Info', 'Camera integration coming soon')}>
                        <Text style={styles.uploadIcon}>📸</Text>
                        <Text style={styles.uploadText}>Tap to take photo</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Describe the hazard (e.g., cracks, water leakage)..."
                        placeholderTextColor={Colors.textSecondary}
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitButtonText}>
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        marginRight: Spacing.md,
    },
    backButtonText: {
        color: Colors.primary,
        fontSize: 16,
    },
    title: {
        ...Typography.h2,
        fontSize: 20,
        color: Colors.textPrimary,
    },
    content: {
        padding: Spacing.lg,
    },
    card: {
        backgroundColor: Colors.surface,
        padding: Spacing.lg,
        borderRadius: 12,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    label: {
        ...Typography.h3,
        fontSize: 16,
        marginBottom: Spacing.md,
        color: Colors.textPrimary,
    },
    uploadBox: {
        height: 150,
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    uploadIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    uploadText: {
        color: Colors.textSecondary,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        padding: Spacing.md,
        color: Colors.textPrimary,
        textAlignVertical: 'top',
        minHeight: 100,
    },
    submitButton: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
