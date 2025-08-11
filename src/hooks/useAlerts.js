// Custom Redux hooks for the DeepSeaGuard application
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import alertsService from "../services/alertsService.js";
import {
  acknowledgeAlert,
  alertReceived,
  clearError,
  clearFilters,
  createAlert,
  deleteAlert,
  fetchAlerts,
  fetchAlertStats,
  markAlertAsRead,
  markMultipleAlertsAsRead,
  resolveAlert,
  selectAlertById,
  selectAlertFilters,
  selectAlertsError,
  selectAlertsLoading,
  selectAlertStats,
  selectAllAlerts,
  selectFilteredAlerts,
  selectHighSeverityAlerts,
  selectIsSubscribed,
  selectUnreadAlertsCount,
  setFilters,
  setSubscribed,
  updateAlert,
} from "../store/slices/alertsSlice.js";

/**
 * Hook for managing alerts state and operations
 * @returns {Object} Alerts state and actions
 */
export const useAlerts = () => {
  const dispatch = useDispatch();

  // Selectors
  const alerts = useSelector(selectAllAlerts);
  const filteredAlerts = useSelector(selectFilteredAlerts);
  const stats = useSelector(selectAlertStats);
  const filters = useSelector(selectAlertFilters);
  const loading = useSelector(selectAlertsLoading);
  const error = useSelector(selectAlertsError);
  const unreadCount = useSelector(selectUnreadAlertsCount);
  const highSeverityAlerts = useSelector(selectHighSeverityAlerts);
  const isSubscribed = useSelector(selectIsSubscribed);

  // Actions
  const actions = {
    // Async actions
    fetchAlerts: useCallback(
      (options) => dispatch(fetchAlerts(options)),
      [dispatch]
    ),
    createAlert: useCallback(
      (alertData) => dispatch(createAlert(alertData)),
      [dispatch]
    ),
    updateAlert: useCallback(
      (alertId, updates) => dispatch(updateAlert({ alertId, updates })),
      [dispatch]
    ),
    acknowledgeAlert: useCallback(
      (alertId) => dispatch(acknowledgeAlert(alertId)),
      [dispatch]
    ),
    resolveAlert: useCallback(
      (alertId, resolution) => dispatch(resolveAlert({ alertId, resolution })),
      [dispatch]
    ),
    markAsRead: useCallback(
      (alertId) => dispatch(markAlertAsRead(alertId)),
      [dispatch]
    ),
    markMultipleAsRead: useCallback(
      (alertIds) => dispatch(markMultipleAlertsAsRead(alertIds)),
      [dispatch]
    ),
    deleteAlert: useCallback(
      (alertId) => dispatch(deleteAlert(alertId)),
      [dispatch]
    ),
    fetchStats: useCallback(() => dispatch(fetchAlertStats()), [dispatch]),

    // Sync actions
    setFilters: useCallback(
      (filters) => dispatch(setFilters(filters)),
      [dispatch]
    ),
    clearFilters: useCallback(() => dispatch(clearFilters()), [dispatch]),
    clearError: useCallback(() => dispatch(clearError()), [dispatch]),

    // Real-time actions
    subscribeToAlerts: useCallback(() => {
      if (!isSubscribed) {
        const unsubscribe = alertsService.subscribeToAlerts((alert) => {
          dispatch(alertReceived(alert));
        });
        dispatch(setSubscribed(true));
        return unsubscribe;
      }
    }, [dispatch, isSubscribed]),

    unsubscribeFromAlerts: useCallback(() => {
      dispatch(setSubscribed(false));
    }, [dispatch]),
  };

  return {
    // State
    alerts,
    filteredAlerts,
    stats,
    filters,
    loading,
    error,
    unreadCount,
    highSeverityAlerts,
    isSubscribed,

    // Actions
    ...actions,
  };
};

/**
 * Hook for getting a specific alert by ID
 * @param {string} alertId - Alert ID
 * @returns {Object|undefined} Alert object or undefined
 */
export const useAlert = (alertId) => {
  return useSelector((state) => selectAlertById(state, alertId));
};

/**
 * Hook for alert statistics
 * @returns {Object} Alert statistics and fetch function
 */
export const useAlertStats = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectAlertStats);
  const loading = useSelector((state) => state.alerts.loading.stats);
  const error = useSelector(selectAlertsError);

  const fetchStats = useCallback(() => {
    dispatch(fetchAlertStats());
  }, [dispatch]);

  return {
    stats,
    loading,
    error,
    fetchStats,
  };
};

/**
 * Hook for alert filters management
 * @returns {Object} Filters state and actions
 */
export const useAlertFilters = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectAlertFilters);

  const setFilters = useCallback(
    (newFilters) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  const clearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const setSeverityFilter = useCallback(
    (severity) => {
      dispatch(setFilters({ severity }));
    },
    [dispatch]
  );

  const setTypeFilter = useCallback(
    (type) => {
      dispatch(setFilters({ type }));
    },
    [dispatch]
  );

  const setStatusFilter = useCallback(
    (status) => {
      dispatch(setFilters({ status }));
    },
    [dispatch]
  );

  const setSortBy = useCallback(
    (sortBy) => {
      dispatch(setFilters({ sortBy }));
    },
    [dispatch]
  );

  const setSortOrder = useCallback(
    (sortOrder) => {
      dispatch(setFilters({ sortOrder }));
    },
    [dispatch]
  );

  return {
    filters,
    setFilters,
    clearFilters,
    setSeverityFilter,
    setTypeFilter,
    setStatusFilter,
    setSortBy,
    setSortOrder,
  };
};

/**
 * Hook for real-time alerts subscription
 * @param {boolean} autoSubscribe - Whether to auto-subscribe on mount
 * @returns {Object} Subscription state and controls
 */
export const useAlertsSubscription = (autoSubscribe = true) => {
  const dispatch = useDispatch();
  const isSubscribed = useSelector(selectIsSubscribed);

  const subscribe = useCallback(() => {
    if (!isSubscribed) {
      const unsubscribe = alertsService.subscribeToAlerts((alert) => {
        dispatch(alertReceived(alert));
      });
      dispatch(setSubscribed(true));
      return unsubscribe;
    }
  }, [dispatch, isSubscribed]);

  const unsubscribe = useCallback(() => {
    dispatch(setSubscribed(false));
  }, [dispatch]);

  useEffect(() => {
    let unsubscribeFn;

    if (autoSubscribe && !isSubscribed) {
      unsubscribeFn = subscribe();
    }

    return () => {
      if (unsubscribeFn) {
        unsubscribeFn();
      }
    };
  }, [autoSubscribe, isSubscribed]); // Removed subscribe and unsubscribe from deps

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
  };
};

/**
 * Hook for bulk alert operations
 * @returns {Object} Bulk operation functions
 */
export const useBulkAlertOperations = () => {
  const dispatch = useDispatch();
  const alerts = useSelector(selectAllAlerts);

  const markAllAsRead = useCallback(() => {
    const unreadAlerts = alerts.filter((alert) => !alert.read);
    const alertIds = unreadAlerts.map((alert) => alert.id);

    if (alertIds.length > 0) {
      dispatch(markMultipleAlertsAsRead(alertIds));
    }
  }, [dispatch, alerts]);

  const acknowledgeMultiple = useCallback(
    async (alertIds) => {
      const promises = alertIds.map((id) => dispatch(acknowledgeAlert(id)));
      return Promise.all(promises);
    },
    [dispatch]
  );

  const resolveMultiple = useCallback(
    async (alertIds, resolution = "") => {
      const promises = alertIds.map((id) =>
        dispatch(resolveAlert({ alertId: id, resolution }))
      );
      return Promise.all(promises);
    },
    [dispatch]
  );

  const deleteMultiple = useCallback(
    async (alertIds) => {
      const promises = alertIds.map((id) => dispatch(deleteAlert(id)));
      return Promise.all(promises);
    },
    [dispatch]
  );

  return {
    markAllAsRead,
    acknowledgeMultiple,
    resolveMultiple,
    deleteMultiple,
  };
};
