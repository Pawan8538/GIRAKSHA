import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../screens/LoginScreen'
import RoleSelectionScreen from '../screens/RoleSelectionScreen'
import RegisterGovScreen from '../screens/RegisterGovScreen'
import RegisterSiteAdminScreen from '../screens/RegisterSiteAdminScreen'
import RegisterWorkerScreen from '../screens/RegisterWorkerScreen'

const Stack = createNativeStackNavigator()

export default function AuthNavigator({ onLogin }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="RoleSelection">
      <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </Stack.Screen>
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="RegisterGov" component={RegisterGovScreen} />
      <Stack.Screen name="RegisterSiteAdmin" component={RegisterSiteAdminScreen} />
      <Stack.Screen name="RegisterWorker" component={RegisterWorkerScreen} />
    </Stack.Navigator>
  )
}
