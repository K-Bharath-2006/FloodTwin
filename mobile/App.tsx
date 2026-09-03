import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from './src/theme/colors';

import { GoogleLoginScreen } from './src/screens/GoogleLoginScreen';
import { PermissionSetupScreen } from './src/screens/PermissionSetupScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CurrentRiskScreen } from './src/screens/CurrentRiskScreen';
import { FloodMapScreen } from './src/screens/FloodMapScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { SheltersScreen } from './src/screens/SheltersScreen';
import { EmergencyInfoScreen } from './src/screens/EmergencyInfoScreen';
import { OfflineStatusScreen } from './src/screens/OfflineStatusScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomColor: Colors.cardBorder,
          borderBottomWidth: 1,
        },
        headerTintColor: Colors.textWhite,
        headerTitleStyle: {
          fontWeight: '900',
          fontSize: 16,
          letterSpacing: 0.5,
        },
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.cardBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Status',
          headerTitle: 'HYDROBREACH CITIZEN',
        }}
      />
      <Tab.Screen
        name="Risk"
        component={CurrentRiskScreen}
        options={{
          title: 'GPS Risk',
          headerTitle: 'OFFLINE GEOFENCE SCANNER',
        }}
      />
      <Tab.Screen
        name="Map"
        component={FloodMapScreen}
        options={{
          title: 'Flood Map',
          headerTitle: 'INUNDATION & HAZARD MAP',
        }}
      />
      <Tab.Screen
        name="Shelters"
        component={SheltersScreen}
        options={{
          title: 'Shelters',
          headerTitle: 'RELIEF SHELTERS & ROUTES',
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: 'Alerts',
          headerTitle: 'EMERGENCY BROADCASTS',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default true for instant demo
  const [hasPermission, setHasPermission] = useState(true);

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
            borderBottomColor: Colors.cardBorder,
            borderBottomWidth: 1,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: '900',
            fontSize: 16,
          },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="GoogleLogin" options={{ headerShown: false }}>
            {(props) => <GoogleLoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
          </Stack.Screen>
        ) : !hasPermission ? (
          <Stack.Screen name="Permissions" options={{ headerShown: false }}>
            {(props) => <PermissionSetupScreen {...props} onComplete={() => setHasPermission(true)} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen
              name="EmergencyInfo"
              component={EmergencyInfoScreen}
              options={{ title: 'Emergency Protocols' }}
            />
            <Stack.Screen
              name="OfflineStatus"
              component={OfflineStatusScreen}
              options={{ title: 'Offline Diagnostics & Sync' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
