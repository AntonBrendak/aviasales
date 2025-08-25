import { AppShell } from '../../src/app-shell/AppShell';
import { Text, View } from 'react-native';
export default function Index() {
    return (
        <AppShell>
            <View style={{ padding: 16 }}><Text>Готово: Mobile клиент поднят ✅</Text></View>
        </AppShell>
    );
}