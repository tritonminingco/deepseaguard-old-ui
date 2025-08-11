import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import alertsService from "../../services/alertsService.js";

// Async thunks for alert operations

/**
 * Fetch alerts from the service
 */
export const fetchAlerts = createAsyncThunk(
  "alerts/fetchAlerts",
  async (options = {}, { rejectWithValue }) => {
    try {
      const alerts = await alertsService.fetchAlerts(options);
      return alerts;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Create a new alert
 */
export const createAlert = createAsyncThunk(
  "alerts/createAlert",
  async (alertData, { rejectWithValue }) => {
    try {
      const alert = await alertsService.createAlert(alertData);
      return alert;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Update an alert
 */
export const updateAlert = createAsyncThunk(
  "alerts/updateAlert",
  async ({ alertId, updates }, { rejectWithValue }) => {
    try {
      const alert = await alertsService.updateAlert(alertId, updates);
      return { alertId, updates: alert };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = createAsyncThunk(
  "alerts/acknowledgeAlert",
  async (alertId, { rejectWithValue }) => {
    try {
      const alert = await alertsService.acknowledgeAlert(alertId);
      return { alertId, updates: alert };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Resolve an alert
 */
export const resolveAlert = createAsyncThunk(
  "alerts/resolveAlert",
  async ({ alertId, resolution }, { rejectWithValue }) => {
    try {
      const alert = await alertsService.resolveAlert(alertId, resolution);
      return { alertId, updates: alert };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Mark alert as read
 */
export const markAlertAsRead = createAsyncThunk(
  "alerts/markAsRead",
  async (alertId, { rejectWithValue }) => {
    try {
      const alert = await alertsService.markAsRead(alertId);
      return { alertId, updates: alert };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Mark multiple alerts as read
 */
export const markMultipleAlertsAsRead = createAsyncThunk(
  "alerts/markMultipleAsRead",
  async (alertIds, { rejectWithValue }) => {
    try {
      const alerts = await alertsService.markMultipleAsRead(alertIds);
      return { alertIds, alerts };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Delete an alert
 */
export const deleteAlert = createAsyncThunk(
  "alerts/deleteAlert",
  async (alertId, { rejectWithValue }) => {
    try {
      const success = await alertsService.deleteAlert(alertId);
      if (success) {
        return alertId;
      } else {
        throw new Error("Failed to delete alert");
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Fetch alert statistics
 */
export const fetchAlertStats = createAsyncThunk(
  "alerts/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const stats = await alertsService.getAlertStats();
      return stats;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Initial state
const initialState = {
  // Alert data
  alerts: [],
  alertsById: {},

  // Statistics
  stats: {
    total: 0,
    unread: 0,
    acknowledged: 0,
    resolved: 0,
    bySeverity: {
      high: 0,
      medium: 0,
      low: 0,
    },
    byType: {
      environmental: 0,
      operational: 0,
      compliance: 0,
      system: 0,
    },
  },

  // UI state
  filters: {
    severity: "all", // 'all', 'high', 'medium', 'low'
    type: "all", // 'all', 'environmental', 'operational', 'compliance', 'system'
    status: "all", // 'all', 'unread', 'acknowledged', 'resolved'
    sortBy: "timestamp", // 'timestamp', 'severity', 'type'
    sortOrder: "desc", // 'asc', 'desc'
  },

  // Loading states
  loading: {
    fetch: false,
    create: false,
    update: false,
    delete: false,
    stats: false,
  },

  // Error state
  error: null,

  // Real-time subscription
  subscribed: false,
};

// Helper functions for state updates
const updateAlertInState = (state, alertId, updates) => {
  if (state.alertsById[alertId]) {
    state.alertsById[alertId] = { ...state.alertsById[alertId], ...updates };
    const index = state.alerts.findIndex((alert) => alert.id === alertId);
    if (index !== -1) {
      state.alerts[index] = state.alertsById[alertId];
    }
  }
};

const addAlertToState = (state, alert) => {
  state.alertsById[alert.id] = alert;
  state.alerts.unshift(alert); // Add to beginning for newest first
};

const removeAlertFromState = (state, alertId) => {
  delete state.alertsById[alertId];
  state.alerts = state.alerts.filter((alert) => alert.id !== alertId);
};

// Create the slice
const alertsSlice = createSlice({
  name: "alerts",
  initialState,
  reducers: {
    // Synchronous actions
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Real-time alert received (from WebSocket)
    alertReceived: (state, action) => {
      const alert = action.payload;
      addAlertToState(state, alert);

      // Update stats
      state.stats.total += 1;
      state.stats.unread += 1;
      state.stats.bySeverity[alert.severity] += 1;
      state.stats.byType[alert.type] += 1;
    },

    // Bulk update alerts (useful for real-time updates)
    updateAlerts: (state, action) => {
      const updates = action.payload;
      updates.forEach(({ alertId, data }) => {
        updateAlertInState(state, alertId, data);
      });
    },

    // Set subscription status
    setSubscribed: (state, action) => {
      state.subscribed = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.loading.fetch = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading.fetch = false;
        state.alerts = action.payload;

        // Create alertsById lookup
        state.alertsById = {};
        action.payload.forEach((alert) => {
          state.alertsById[alert.id] = alert;
        });
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading.fetch = false;
        state.error = action.payload;
      })

      // Create alert
      .addCase(createAlert.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.loading.create = false;
        addAlertToState(state, action.payload);
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload;
      })

      // Update alert
      .addCase(updateAlert.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateAlert.fulfilled, (state, action) => {
        state.loading.update = false;
        const { alertId, updates } = action.payload;
        updateAlertInState(state, alertId, updates);
      })
      .addCase(updateAlert.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload;
      })

      // Acknowledge alert
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const { alertId, updates } = action.payload;
        updateAlertInState(state, alertId, updates);
      })

      // Resolve alert
      .addCase(resolveAlert.fulfilled, (state, action) => {
        const { alertId, updates } = action.payload;
        updateAlertInState(state, alertId, updates);
      })

      // Mark as read
      .addCase(markAlertAsRead.fulfilled, (state, action) => {
        const { alertId, updates } = action.payload;
        updateAlertInState(state, alertId, updates);
      })

      // Mark multiple as read
      .addCase(markMultipleAlertsAsRead.fulfilled, (state, action) => {
        const { alertIds } = action.payload;
        alertIds.forEach((alertId) => {
          updateAlertInState(state, alertId, {
            read: true,
            readAt: new Date().toISOString(),
          });
        });
      })

      // Delete alert
      .addCase(deleteAlert.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteAlert.fulfilled, (state, action) => {
        state.loading.delete = false;
        removeAlertFromState(state, action.payload);
      })
      .addCase(deleteAlert.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      })

      // Fetch stats
      .addCase(fetchAlertStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchAlertStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchAlertStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  setFilters,
  clearFilters,
  clearError,
  alertReceived,
  updateAlerts,
  setSubscribed,
} = alertsSlice.actions;

// Selectors
export const selectAllAlerts = (state) => state.alerts.alerts;
export const selectAlertsById = (state) => state.alerts.alertsById;
export const selectAlertById = (state, alertId) =>
  state.alerts.alertsById[alertId];
export const selectAlertStats = (state) => state.alerts.stats;
export const selectAlertFilters = (state) => state.alerts.filters;
export const selectAlertsLoading = (state) => state.alerts.loading;
export const selectAlertsError = (state) => state.alerts.error;
export const selectIsSubscribed = (state) => state.alerts.subscribed;

// Filtered alerts selector with memoization
export const selectFilteredAlerts = createSelector(
  [selectAllAlerts, selectAlertFilters],
  (alerts, filters) => {
    let filtered = [...alerts];

    // Apply severity filter
    if (filters.severity !== "all") {
      filtered = filtered.filter(
        (alert) => alert.severity === filters.severity
      );
    }

    // Apply type filter
    if (filters.type !== "all") {
      filtered = filtered.filter((alert) => alert.type === filters.type);
    }

    // Apply status filter
    if (filters.status !== "all") {
      switch (filters.status) {
        case "unread":
          filtered = filtered.filter((alert) => !alert.read);
          break;
        case "acknowledged":
          filtered = filtered.filter(
            (alert) => alert.acknowledged && !alert.resolved
          );
          break;
        case "resolved":
          filtered = filtered.filter((alert) => alert.resolved);
          break;
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "timestamp":
          comparison = new Date(a.timestamp) - new Date(b.timestamp);
          break;
        case "severity":
          const severityOrder = { high: 3, medium: 2, low: 1 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === "desc" ? -comparison : comparison;
    });

    return filtered;
  }
);

// Unread alerts count selector with memoization
export const selectUnreadAlertsCount = createSelector(
  [selectAllAlerts],
  (alerts) => alerts.filter((alert) => !alert.read).length
);

// High severity alerts selector with memoization
export const selectHighSeverityAlerts = createSelector(
  [selectAllAlerts],
  (alerts) => alerts.filter((alert) => alert.severity === "high")
);

export default alertsSlice.reducer;
