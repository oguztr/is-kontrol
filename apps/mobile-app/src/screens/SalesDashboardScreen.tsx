import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export function SalesDashboardScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Satış Paneli</Text>
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.label}>Açık Teklifler</Text>
          <Text style={styles.value}>0</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Bekleyen Siparişler</Text>
          <Text style={styles.value}>0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  grid: { gap: 12 },
  card: { backgroundColor: '#143055', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { color: '#dbeafe', marginBottom: 8 },
  value: { color: '#fff', fontSize: 28, fontWeight: '700' },
});
