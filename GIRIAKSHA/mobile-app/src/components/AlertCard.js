import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../utils/constants'

export default function AlertCard({ alert }) {
  const dateStr = alert.date ? new Date(alert.date).toLocaleString() : 'Just now'

  return (
    <View style={[styles.card, alert.severity === 'critical' && styles.critical, alert.severity === 'high' && styles.high]}>
      <View style={styles.headerRow}>
        <Text style={styles.typeBadge}>{alert.type || 'ALERT'}</Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>
      <Text style={styles.title}>{alert.title}</Text>
      <Text style={styles.body}>{alert.message}</Text>
      <Text style={styles.footer}>Source: {alert.source || 'System'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info, // Default info color
  },
  critical: {
    borderLeftColor: COLORS.danger,
    backgroundColor: '#3f1a1a',
  },
  high: {
    borderLeftColor: COLORS.warning,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  date: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  body: {
    color: '#cbd5f5',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    marginTop: 12,
    fontSize: 11,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
})

