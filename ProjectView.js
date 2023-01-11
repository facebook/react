// ProjectView.js
import React from 'react';
import { View, Text } from 'react-native';

export default function ProjectView({ navigation }) {
    const title = navigation.getParam('title', 'No Title');
    return (
        <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', margin: 20 }}>{title}</Text>
            <Text style={{ fontSize: 18, margin: 20 }}>
                Here// additional content about the project, such as screenshots, a detailed description, and a link to the live project
                <Text>Project Description: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed gravida, quam id pretium suscipit, magna risus tempor eros, ut scelerisque lorem magna vel est.</Text>
                <Text>Live Link: https://example.com</Text>
                <Image source={require('./assets/project1-detail.png')} style={{ width: '100%', height: 300 }} />
            </View>
        </View>
    );
}
