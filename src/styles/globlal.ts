import { StyleSheet } from "react-native";

// Colores corporativos Moteros Oaxaca
export const COLORS = {
    white: "#FFFFFF",
    black: "#1D1D1B",
    red: "#E51E2F",
};

export const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: COLORS.black,
        padding: 10
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5
    },
    button: {
        backgroundColor: COLORS.red,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center'
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: 'bold'
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    rowTitle: {
        fontSize: 16
    },
    rowButton: {
        backgroundColor: COLORS.red,
        padding: 5,
        borderRadius: 5,
        alignItems: 'center'
    },
    rowButtonText: {
        color: COLORS.white,
        fontWeight: 'bold'
    },
    tapLabel: {
        paddingHorizontal: 10,
        color: COLORS.white,
        fontWeight: '500',
    },
    tapContainer: {
        borderRadius: 22,
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabNavigator: {
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        height: 90,
        margin: 20,
        bottom: 30,
        borderRadius: 20,
        backgroundColor: COLORS.black,
    }

})