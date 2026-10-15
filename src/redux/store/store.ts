import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import authReducer from '../slices/authSlice';
import attendanceAccessReducer from '../slices/attendanceAccessSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        attendanceAccess: attendanceAccessReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
