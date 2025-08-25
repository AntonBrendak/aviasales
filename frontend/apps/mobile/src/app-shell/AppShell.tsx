import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { paperTheme } from '@packages/ui-mobile/src/theme/paperTheme';
import { SafeAreaView, View, Text } from 'react-native';


export const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => (
    <PaperProvider theme={paperTheme}>
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ padding: 12, borderBottomWidth: 1 }}><Text>Авиабилеті</Text></View>
            <View style={{ flex: 1 }}>{children}</View>
        </SafeAreaView>
    </PaperProvider>
);