import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { Image, TouchableOpacity } from 'react-native'
import { COLORS, ROLES } from '../utils/constants'

// Screens
import HomeScreen from '../screens/HomeScreen'
import MapScreen from '../screens/MapScreen'
import ClimateScreen from '../screens/ClimateScreen'
import ComplaintScreen from '../screens/ComplaintScreen'
import SosScreen from '../screens/SosScreen'
import WorkerManagementScreen from '../screens/WorkerManagementScreen'
import AlertsScreen from '../screens/AlertsScreen'
import GovAlertsScreen from '../screens/GovAlertsScreen'
import AdminScreen from '../screens/AdminScreen'
import MLPredictScreen from '../screens/MLPredictScreen'
import MLDetectScreen from '../screens/MLDetectScreen'
import MLForecastScreen from '../screens/MLForecastScreen'
import ProfileScreen from '../screens/ProfileScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function HomeStack({ onLogout, user }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={({ navigation }) => ({
          title: 'Dashboard',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Ionicons name="person-circle-outline" size={32} color={COLORS.text} />
              </TouchableOpacity>
            </TouchableOpacity>
          )
        })}
      />
      <Stack.Screen name="Alerts" component={AlertsScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Climate" component={ClimateScreen} />
      <Stack.Screen name="WorkerManagement" component={WorkerManagementScreen} options={{ title: 'Manage Workers' }} />
      <Stack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

function MLStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
      }}
    >
      <Stack.Screen name="MLMain" component={MLPredictScreen} options={{ title: 'ML Predictions' }} />
      <Stack.Screen name="MLDetect" component={MLDetectScreen} options={{ title: 'Crack Detection' }} />
      <Stack.Screen name="MLForecast" component={MLForecastScreen} options={{ title: '72-Hour Forecast' }} />
    </Stack.Navigator>
  )
}



export default function AppNavigator({ user, onLogout }) {
  const isSuperAdmin = user?.role_name === ROLES.SUPER_ADMIN
  const isSiteAdmin = user?.role_name === ROLES.SITE_ADMIN
  const isFieldWorker = user?.role_name === ROLES.FIELD_WORKER
  const isGov = user?.role_name === ROLES.GOV_AUTHORITY

  const canSeeML = isSuperAdmin || isSiteAdmin
  const canSeeTasks = isSuperAdmin || isSiteAdmin || isFieldWorker
  const canSeeAdvisories = isSuperAdmin || isGov
  const canSeeAdmin = isSuperAdmin

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline'

          } else if (route.name === 'Report') {
            iconName = focused ? 'camera' : 'camera-outline'
          } else if (route.name === 'SOS') {
            iconName = focused ? 'warning' : 'warning-outline'

          } else if (route.name === 'ML') {
            iconName = focused ? 'analytics' : 'analytics-outline'
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline'
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline'
          } else if (route.name === 'Advisories') {
            iconName = focused ? 'megaphone' : 'megaphone-outline'
          } else if (route.name === 'Admin') {
            iconName = focused ? 'settings' : 'settings-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        options={{ title: 'Home', headerShown: false }}
      >
        {() => <HomeStack onLogout={onLogout} user={user} />}
      </Tab.Screen>

      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Report" component={ComplaintScreen} />
      <Tab.Screen name="SOS" component={SosScreen} />



      {canSeeML && (
        <Tab.Screen
          name="ML"
          component={MLStack}
          options={{ headerShown: false }}
        />
      )}

      {canSeeAdvisories && (
        <Tab.Screen
          name="Advisories"
          component={GovAlertsScreen}
          options={{ title: 'Post Advisory' }}
        />
      )}

      {canSeeAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            headerRight: () => (
              <Ionicons
                name="log-out-outline"
                color={COLORS.danger}
                size={24}
                style={{ marginRight: 16 }}
                onPress={onLogout}
              />
            ),
          }}
        />
      )}
    </Tab.Navigator >
  )
}
