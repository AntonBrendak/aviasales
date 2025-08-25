import { useState } from 'react';
import { View, TextInput, Button, Text, FlatList } from 'react-native';
import { useCreateSearch } from '../../src/features/search/useCreateSearch.native';
import { useSearchPolling } from '../../src/features/search/useSearchPolling.native';

export default function SearchScreen() {
  const [origin, setOrigin] = useState('DUS');
  const [destination, setDestination] = useState('CDG');
  const [searchId, setSearchId] = useState<string|undefined>();
  const create = useCreateSearch();
  const results = useSearchPolling(searchId, !!searchId);

  return (
    <View style={{ padding: 16 }}>
      <TextInput value={origin} onChangeText={setOrigin} placeholder="Origin"/>
      <TextInput value={destination} onChangeText={setDestination} placeholder="Destination"/>
      <Button title="Search" onPress={async ()=> {
        const { data } = await create.mutateAsync({ origin, destination, departDate: new Date().toISOString().slice(0,10), pax:{adults:1} });
        setSearchId(data.searchId);
      }}/>
      <Text>Progress: {results.data?.progress ?? 0}%</Text>
      <FlatList
        data={results.data?.items ?? []}
        keyExtractor={(i)=>i.id}
        renderItem={({item})=> <Text>{item.slices?.[0]?.from}→{item.slices?.[0]?.to} {item.price.amount} {item.price.currency}</Text>}
      />
    </View>
  );
}