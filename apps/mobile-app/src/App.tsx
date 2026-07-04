import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import { Button } from './components/Button';
import { CreateOfferScreen } from './screens/CreateOfferScreen';
import { SalesDashboardScreen } from './screens/SalesDashboardScreen';
import { StockStatusScreen } from './screens/StockStatusScreen';

type Screen = 'stock' | 'offer' | 'sales';

export function App() {
  const [screen, setScreen] = useState<Screen>('stock');

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.tabs}>
        <Button label="Stok" onPress={() => setScreen('stock')} />
        <Button label="Teklif" onPress={() => setScreen('offer')} />
        <Button label="Satış" onPress={() => setScreen('sales')} />
      </View>
      {screen === 'stock' && <StockStatusScreen />}
      {screen === 'offer' && <CreateOfferScreen />}
      {screen === 'sales' && <SalesDashboardScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  tabs: { flexDirection: 'row', gap: 8, padding: 12 },
});

export default App;
