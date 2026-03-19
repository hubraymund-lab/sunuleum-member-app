// Created: 2026-03-18
import { createContext, useContext, useReducer, useEffect } from 'react';
import { loadData, saveData, STORAGE_KEYS } from '../utils/storage';

const AppContext = createContext();

const initialState = {
  members: loadData(STORAGE_KEYS.MEMBERS) || [],
  attendance: loadData(STORAGE_KEYS.ATTENDANCE) || [],
  fees: loadData(STORAGE_KEYS.FEES) || [],
};

function reducer(state, action) {
  switch (action.type) {
    // Members
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] };
    case 'UPDATE_MEMBER':
      return { ...state, members: state.members.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_MEMBER':
      return { ...state, members: state.members.filter(m => m.id !== action.payload) };
    // Attendance
    case 'ADD_ATTENDANCE':
      return { ...state, attendance: [...state.attendance, action.payload] };
    case 'DELETE_ATTENDANCE':
      return { ...state, attendance: state.attendance.filter(a => a.id !== action.payload) };
    // Fees
    case 'ADD_FEE':
      return { ...state, fees: [...state.fees, action.payload] };
    case 'UPDATE_FEE':
      return { ...state, fees: state.fees.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'DELETE_FEE':
      return { ...state, fees: state.fees.filter(f => f.id !== action.payload) };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => { saveData(STORAGE_KEYS.MEMBERS, state.members); }, [state.members]);
  useEffect(() => { saveData(STORAGE_KEYS.ATTENDANCE, state.attendance); }, [state.attendance]);
  useEffect(() => { saveData(STORAGE_KEYS.FEES, state.fees); }, [state.fees]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
