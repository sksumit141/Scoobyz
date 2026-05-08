import React from 'react';
import { View, Text } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import LandingScreen from '../screens/LandingScreen';
import CustomDrawer from '../components/CustomDrawer';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import AddressBookScreen from '../screens/AddressBookScreen';

import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import SupportChatScreen from '../screens/SupportChatScreen';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      initialRouteName="Landing"
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: '80%',
          borderTopRightRadius: 30,
          borderBottomRightRadius: 30,
          overflow: 'hidden',
        },
      }}
    >
      <Drawer.Screen name="Landing" component={LandingScreen} />
      <Drawer.Screen name="Explore" component={ExploreScreen} />
      <Drawer.Screen name="Bookings" component={MyBookingsScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="Help" component={HelpSupportScreen} />
      <Drawer.Screen name="SupportChat" component={SupportChatScreen} />
      <Drawer.Screen 
        name="AddressBook" 
        component={AddressBookScreen} 
      />
    </Drawer.Navigator>
  );
}
