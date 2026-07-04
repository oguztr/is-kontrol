import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type InputProps = TextInputProps & {
  label: string;
};

export function Input({ label, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor="#9ca3af" {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: { marginBottom: 4, color: '#374151', fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
  },
});
