// PortfolioPage.js

import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';

export default function PortfolioPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Portfolio</Text>
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Image
            source={require('./assets/project1.png')}
            style={styles.cardImage}
          />
          <Text style={styles.cardText}>Project 1: A e-commerce website</Text>
        </View>
        <View style={styles.card}>
          <Image
            source={require('./assets/project2.png')}
            style={styles.cardImage}
          />
          <Text style={styles.cardText}>Project 2: A Social Media App</Text>
        </View>
        <View style={styles.card}>
          <Image
            source={require('./assets/project3.png')}
            style={styles.cardImage}
          />
          <Text style={styles.cardText}>Project 3: A Job Board Platform</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    width: '30%',
    height: 250,
    margin: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 3,
  },
  cardImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
  },
});
