import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

type ButtonProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({ label, onPress, style, textStyle }: ButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#143055',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
});
