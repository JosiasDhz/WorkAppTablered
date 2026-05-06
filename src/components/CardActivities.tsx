import { View, Text, ScrollView, RefreshControl } from 'react-native'
import React, { useState } from 'react'

const CardActivities = () => {

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        setRefreshing(false);
    }, []);


    const data = [
        { id: 1, color: 'bg-tableAccentRed/40', title: 'Trabajar en el restaurante mesero', hours: '01', time: 'Horas', start: '09:30 AM', end: '10:30 AM' },
        { id: 2, color: 'bg-tableTeal/40', title: 'Trabajar como repartidor', hours: '23', time: 'Minutos', start: '10:30 AM', end: '11:30 AM' },
        { id: 3, color: 'bg-tableGold/40', title: 'Trabajar como limpiador de cocina', hours: '03', time: 'Horas', start: '11:30 AM', end: '12:30 PM' },
        { id: 4, color: 'bg-tableAccentRed/40', title: 'Trabajar en el restaurante mesero', hours: '01', time: 'Horas', start: '09:30 AM', end: '10:30 AM' },
        { id: 5, color: 'bg-tableTeal/40', title: 'Otra actividad', hours: '23', time: 'Minutos', start: '10:30 AM', end: '11:30 AM' },
        { id: 6, color: 'bg-tableGold/40', title: 'Actividad 3', hours: '03', time: 'Horas', start: '11:30 AM', end: '12:30 PM' },
        { id: 7, color: 'bg-tableAccentRed/40', title: 'Trabajar en el restaurante mesero', hours: '01', time: 'Horas', start: '09:30 AM', end: '10:30 AM' },
        { id: 8, color: 'bg-tableTeal/40', title: 'Otra actividad', hours: '23', time: 'Minutos', start: '10:30 AM', end: '11:30 AM' },
        { id: 9, color: 'bg-tableGold/40', title: 'Actividad 3', hours: '03', time: 'Horas', start: '11:30 AM', end: '12:30 PM' },

    ];

    return (
        <>
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {data.map(item => (
                    <View key={item.id} className={`${item.color} mb-3 rounded-xl p-3 `}>
                        <Text className='text-lg font-medium ml-2'>{item.title}</Text>
                        <View className='flex flex-row space-x-2 justify-between items-center mt-3'>
                            <View className="flex-initial w-1/3 ">
                                <Text className='text-center text-5xl font-normal√'>{item.hours}</Text>
                                <Text className='text-center text-sm font-medium'>{item.time}</Text>
                            </View>
                            <View className="flex-initial  w-1/3">
                                <Text className='text-center text-lg font-medium'>Inicio</Text>
                                <Text className='text-center text-lg font-normal'>{item.start}</Text>
                            </View>
                            <View className="flex-initial  w-1/3">
                                <Text className='text-center text-lg font-medium'>Finaliza</Text>
                                <Text className='text-center text-lg font-normal'>{item.end}</Text>
                            </View>
                        </View>
                    </View>
                ))}
                <View style={{ height: 300 }} />
            </ScrollView>
        </>
    )
}

export default CardActivities