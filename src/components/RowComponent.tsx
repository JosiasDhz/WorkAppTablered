import { View, ViewStyle, StyleProp } from 'react-native'
import React, { ReactNode } from 'react'
import { styles } from '../styles/globlal'

interface Props {
    children: ReactNode | ReactNode[],
    localStyles?: StyleProp<ViewStyle>

}

const RowComponent = (props: Props) => {

    const { children, localStyles } = props

    return (
        <View
            style={[
                localStyles,
                styles.tapContainer,
                {
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    height: 64,
                    minWidth: 88,
                    alignSelf: 'center',
                }
            ]} >
            {children}
        </View>



    )
}

export default RowComponent