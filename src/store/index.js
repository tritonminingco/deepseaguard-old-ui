import { configureStore } from "@reduxjs/toolkit";
import alertsReducer from "./slices/alertsSlice.js";

/**
 * Configure and create the Redux store
 */
export const store = configureStore({
  reducer: {
    alerts: alertsReducer,
    // Other reducers can be added here as the application grows
    // example: ui: uiReducer, auth: authReducer, mission: missionReducer
  },

  // Middleware configuration
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Configure serializable check for Redux Toolkit
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
        ignoredPaths: ["_persist"],
      },
    }),

  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== "production",
});

// Export store types for TypeScript usage (when needed)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

export default store;
