import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import CardActivities from './CardActivities'

const CardDay = () => {
    return (
        <>
            <View className='bg-white h-screen p-5 shadow-xl rounded-t-3xl  '>
                <Text className='text-xl font-normal pl-5 mb-4'>Actividades del día</Text>
                <CardActivities />
            </View>
        </>
    )
}

export default CardDay