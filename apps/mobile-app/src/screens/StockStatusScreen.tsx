import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';

export function StockStatusScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Stok Durumu</Text>
      <View style={styles.card}>
        <Text style={styles.metric}>Toplam SKU: 0</Text>
        <Text style={styles.metric}>Kritik stok: 0</Text>
      </View>
      <Button label="Yenile" onPress={() => undefined} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#f3f4f6', borderRadius: 12, padding: 16, marginBottom: 16 },
  metric: { fontSize: 16, marginBottom: 8 },
});
