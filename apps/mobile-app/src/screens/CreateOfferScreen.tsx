import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

export function CreateOfferScreen() {
  const [customerId, setCustomerId] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Teklif Oluştur</Text>
      <Input label="Müşteri ID" value={customerId} onChangeText={setCustomerId} />
      <Button label="Teklif Kaydet" onPress={() => undefined} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
});
