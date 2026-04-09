import { useReducer, useCallback } from "react";

const initialState = {
  // Core data
  jobs: [],
  workers: [],
  schedules: [],
  jobProgress: {},

  // UI State
  selectedDate: new Date().toISOString().split('T')[0],
  activePanel: 'schedule', // schedule, jobs, workers

  // Loading states
  loading: {
    jobs: false,
    workers: false,
    schedules: false,
    progress: false
  },

  // Error states
  errors: {},

  // Modal/Dialog states
  modals: {
    addJob: false,
    editJob: false,
    addWorker: false,
    editWorker: false,
    addSchedule: false,
    editSchedule: false,
    bulkAssign: false,
    printPreview: false
  },

  // Form data
  editingJob: null,
  editingWorker: null,
  editingSchedule: null,

  // Search/Filter states
  filters: {
    jobSearch: '',
    workerSearch: '',
    roleFilter: 'all',
    statusFilter: 'all',
    dateRange: null
  },

  // Bulk operations
  bulkSelection: [],
  bulkOperation: null
};

const actionTypes = {
  // Data actions
  SET_JOBS: 'SET_JOBS',
  SET_WORKERS: 'SET_WORKERS',
  SET_SCHEDULES: 'SET_SCHEDULES',
  SET_JOB_PROGRESS: 'SET_JOB_PROGRESS',

  // Single entity updates
  UPDATE_JOB: 'UPDATE_JOB',
  UPDATE_WORKER: 'UPDATE_WORKER',
  UPDATE_SCHEDULE: 'UPDATE_SCHEDULE',

  // UI actions
  SET_SELECTED_DATE: 'SET_SELECTED_DATE',
  SET_ACTIVE_PANEL: 'SET_ACTIVE_PANEL',

  // Modal actions
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',

  // Loading actions
  SET_LOADING: 'SET_LOADING',

  // Error actions
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Filter actions
  SET_FILTER: 'SET_FILTER',
  RESET_FILTERS: 'RESET_FILTERS',

  // Form actions
  SET_EDITING_ENTITY: 'SET_EDITING_ENTITY',

  // Bulk actions
  SET_BULK_SELECTION: 'SET_BULK_SELECTION',
  ADD_TO_BULK_SELECTION: 'ADD_TO_BULK_SELECTION',
  REMOVE_FROM_BULK_SELECTION: 'REMOVE_FROM_BULK_SELECTION',
  CLEAR_BULK_SELECTION: 'CLEAR_BULK_SELECTION',

  // Batch updates
  BATCH_UPDATE: 'BATCH_UPDATE'
};

function reducer(state, action) {
  switch (action.type) {
    // Data actions
    case actionTypes.SET_JOBS:
      return { ...state, jobs: action.payload };

    case actionTypes.SET_WORKERS:
      return { ...state, workers: action.payload };

    case actionTypes.SET_SCHEDULES:
      return { ...state, schedules: action.payload };

    case actionTypes.SET_JOB_PROGRESS:
      return { ...state, jobProgress: action.payload };

    // Single entity updates
    case actionTypes.UPDATE_JOB:
      return {
        ...state,
        jobs: state.jobs.map(job =>
          job.id === action.payload.id ? action.payload : job
        )
      };

    case actionTypes.UPDATE_WORKER:
      return {
        ...state,
        workers: state.workers.map(worker =>
          worker.id === action.payload.id ? action.payload : worker
        )
      };

    case actionTypes.UPDATE_SCHEDULE:
      return {
        ...state,
        schedules: state.schedules.map(schedule =>
          schedule.id === action.payload.id ? action.payload : schedule
        )
      };

    // UI actions
    case actionTypes.SET_SELECTED_DATE:
      return { ...state, selectedDate: action.payload };

    case actionTypes.SET_ACTIVE_PANEL:
      return { ...state, activePanel: action.payload };

    // Modal actions
    case actionTypes.OPEN_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: true }
      };

    case actionTypes.CLOSE_MODAL:
      return {
        ...state,
        modals: { ...state.modals, [action.payload]: false }
      };

    // Loading actions
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };

    // Error actions
    case actionTypes.SET_ERROR:
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.error }
      };

    case actionTypes.CLEAR_ERROR:
      const newErrors = { ...state.errors };
      delete newErrors[action.payload];
      return { ...state, errors: newErrors };

    // Filter actions
    case actionTypes.SET_FILTER:
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value }
      };

    case actionTypes.RESET_FILTERS:
      return { ...state, filters: initialState.filters };

    // Form actions
    case actionTypes.SET_EDITING_ENTITY:
      return {
        ...state,
        [action.payload.key]: action.payload.value
      };

    // Bulk actions
    case actionTypes.SET_BULK_SELECTION:
      return { ...state, bulkSelection: action.payload };

    case actionTypes.ADD_TO_BULK_SELECTION:
      return {
        ...state,
        bulkSelection: [...state.bulkSelection, action.payload]
      };

    case actionTypes.REMOVE_FROM_BULK_SELECTION:
      return {
        ...state,
        bulkSelection: state.bulkSelection.filter(id => id !== action.payload)
      };

    case actionTypes.CLEAR_BULK_SELECTION:
      return { ...state, bulkSelection: [] };

    // Batch updates
    case actionTypes.BATCH_UPDATE:
      return action.payload.reduce((acc, update) => {
        return reducer(acc, update);
      }, state);

    default:
      return state;
  }
}

export function useCrewSchedulerState() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Data setters
  const setJobs = useCallback((jobs) => {
    dispatch({ type: actionTypes.SET_JOBS, payload: jobs });
  }, []);

  const setWorkers = useCallback((workers) => {
    dispatch({ type: actionTypes.SET_WORKERS, payload: workers });
  }, []);

  const setSchedules = useCallback((schedules) => {
    dispatch({ type: actionTypes.SET_SCHEDULES, payload: schedules });
  }, []);

  const setJobProgress = useCallback((progress) => {
    dispatch({ type: actionTypes.SET_JOB_PROGRESS, payload: progress });
  }, []);

  // Single entity updates
  const updateJob = useCallback((job) => {
    dispatch({ type: actionTypes.UPDATE_JOB, payload: job });
  }, []);

  const updateWorker = useCallback((worker) => {
    dispatch({ type: actionTypes.UPDATE_WORKER, payload: worker });
  }, []);

  const updateSchedule = useCallback((schedule) => {
    dispatch({ type: actionTypes.UPDATE_SCHEDULE, payload: schedule });
  }, []);

  // UI setters
  const setSelectedDate = useCallback((date) => {
    dispatch({ type: actionTypes.SET_SELECTED_DATE, payload: date });
  }, []);

  const setActivePanel = useCallback((panel) => {
    dispatch({ type: actionTypes.SET_ACTIVE_PANEL, payload: panel });
  }, []);

  // Modal controls
  const openModal = useCallback((modalName) => {
    dispatch({ type: actionTypes.OPEN_MODAL, payload: modalName });
  }, []);

  const closeModal = useCallback((modalName) => {
    dispatch({ type: actionTypes.CLOSE_MODAL, payload: modalName });
  }, []);

  // Loading controls
  const setLoading = useCallback((key, value) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: { key, value } });
  }, []);

  // Error controls
  const setError = useCallback((key, error) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: { key, error } });
  }, []);

  const clearError = useCallback((key) => {
    dispatch({ type: actionTypes.CLEAR_ERROR, payload: key });
  }, []);

  // Filter controls
  const setFilter = useCallback((key, value) => {
    dispatch({ type: actionTypes.SET_FILTER, payload: { key, value } });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: actionTypes.RESET_FILTERS });
  }, []);

  // Form controls
  const setEditingEntity = useCallback((key, value) => {
    dispatch({ type: actionTypes.SET_EDITING_ENTITY, payload: { key, value } });
  }, []);

  // Bulk selection controls
  const setBulkSelection = useCallback((selection) => {
    dispatch({ type: actionTypes.SET_BULK_SELECTION, payload: selection });
  }, []);

  const addToBulkSelection = useCallback((id) => {
    dispatch({ type: actionTypes.ADD_TO_BULK_SELECTION, payload: id });
  }, []);

  const removeFromBulkSelection = useCallback((id) => {
    dispatch({ type: actionTypes.REMOVE_FROM_BULK_SELECTION, payload: id });
  }, []);

  const clearBulkSelection = useCallback(() => {
    dispatch({ type: actionTypes.CLEAR_BULK_SELECTION });
  }, []);

  // Batch updates
  const batchUpdate = useCallback((updates) => {
    dispatch({ type: actionTypes.BATCH_UPDATE, payload: updates });
  }, []);

  return {
    state,
    actions: {
      setJobs,
      setWorkers,
      setSchedules,
      setJobProgress,
      updateJob,
      updateWorker,
      updateSchedule,
      setSelectedDate,
      setActivePanel,
      openModal,
      closeModal,
      setLoading,
      setError,
      clearError,
      setFilter,
      resetFilters,
      setEditingEntity,
      setBulkSelection,
      addToBulkSelection,
      removeFromBulkSelection,
      clearBulkSelection,
      batchUpdate
    }
  };
}

export default useCrewSchedulerState;