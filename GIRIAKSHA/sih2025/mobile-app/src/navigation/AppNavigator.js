import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import EvacuationScreen from '../screens/EvacuationScreen';
import ClimateScreen from '../screens/ClimateScreen';
import PredictionScreen from '../screens/PredictionScreen';
import ReportScreen from '../screens/ReportScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#1a1b1e',
                        borderBottomColor: '#333',
                        borderBottomWidth: 1,
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    cardStyle: { backgroundColor: '#1a1b1e' },
                }}
            >
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'GeoGuard Mobile' }}
                />
                <Stack.Screen
                    name="Map"
                    component={MapScreen}
                    options={{ title: 'Risk Heatmap', headerShown: false }}
                />
                <Stack.Screen
                    name="Evacuation"
                    component={EvacuationScreen}
                    options={{ title: 'Emergency Mode', headerShown: false }}
                />
                <Stack.Screen
                    name="Climate"
                    component={ClimateScreen}
                    options={{ title: 'Climate Simulator', headerShown: false }}
                />
                <Stack.Screen
                    name="Prediction"
                    component={PredictionScreen}
                    options={{ title: 'Prediction Engine' }}
                />
                <Stack.Screen
                    name="Report"
                    component={ReportScreen}
                    options={{ title: 'Report Hazard' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
