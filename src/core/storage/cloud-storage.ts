import { 
  StorageProvider, 
  StorageError, 
  StorageErrorCode, 
  StorageSyncStatus, 
  StorageItemMetadata, 
  StorageEvent 
} from './types';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  writeBatch,
  onSnapshot,
  getDocs,
  Firestore, 
  DocumentData
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signInAnonymously,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';

/**
 * Cloud provider types
 */
export enum CloudProvider {
  FIREBASE = 'firebase',
  CUSTOM = 'custom',
}

/**
 * Interface for Firebase configuration
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  email?: string;
  password?: string;
  collectionName?: string;
}

/**
 * Interface for custom API configuration
 */
export interface CustomApiConfig {
  /** API endpoint for custom cloud storage service */
  apiEndpoint: string;
  /** Authentication token or key for the API */
  authToken: string;
  /** Custom headers to include with requests */
  headers?: Record<string, string>;
}

/**
 * Interface for cloud storage configuration
 */
export interface CloudStorageConfig {
  /** The cloud provider to use */
  provider: CloudProvider;
  /** Firebase-specific configuration */
  firebase?: FirebaseConfig;
  /** Custom API configuration */
  customApi?: CustomApiConfig;
  /** Auto-sync interval in milliseconds (0 to disable) */
  syncInterval?: number;
  /** Whether to sync on startup */
  syncOnStartup?: boolean;
  /** Whether to use optimistic updates (update local then sync to cloud) */
  optimisticUpdates?: boolean;
  /** Maximum number of operations to batch in a single request */
  maxBatchSize?: number;
  /** Function to handle conflict resolution */
  conflictResolver?: ConflictResolver;
}

/**
 * Type for conflict resolution function
 */
export type ConflictResolver = (local: unknown, remote: unknown, key: string) => unknown;

/**
 * Default cloud storage configuration
 */
const DEFAULT_CONFIG: CloudStorageConfig = {
  provider: CloudProvider.FIREBASE,
  syncInterval: 0, // Disabled by default
  syncOnStartup: false,
  optimisticUpdates: true,
  maxBatchSize: 500,
};

/**
 * Interface for a pending operation
 */
interface PendingOperation {
  type: 'set' | 'remove';
  key: string;
  value?: unknown;
  timestamp: number;
}

/**
 * Interface for a sync item
 */
interface SyncItem {
  key: string;
  value: unknown;
  metadata: StorageItemMetadata;
  deleted?: boolean;
}

/**
 * Cloud storage service
 * Provides synchronization with remote cloud storage
 */
export class CloudStorageService implements StorageProvider {
  private config: CloudStorageConfig;
  private localProvider: StorageProvider;
  private syncTimer: number | null = null;
  private syncStatus: StorageSyncStatus = {
    lastSyncTime: null,
    syncInProgress: false,
    syncError: null,
  };
  private syncListeners: Array<(status: StorageSyncStatus) => void> = [];
  private changeListeners: Array<(event: StorageEvent, key?: string) => void> = [];
  private pendingOperations: PendingOperation[] = [];
  private firebaseApp: FirebaseApp | null = null;
  private firestore: Firestore | null = null;
  private auth: Auth | null = null;
  private user: FirebaseUser | null = null;
  private unsubscribeSnapshot: (() => void) | null = null;
  private initialized = false;
  private offlineMode = false;

  /**
   * Creates a new instance of CloudStorageService
   * @param localProvider Local storage provider to use as primary storage
   * @param config Cloud storage configuration
   */
  constructor(localProvider: StorageProvider, config: CloudStorageConfig = DEFAULT_CONFIG) {
    this.localProvider = localProvider;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize cloud provider
    this.initialize().catch(error => {
      console.error('Failed to initialize cloud storage:', error);
      this.offlineMode = true;
    });
  }

  /**
   * Initialize cloud storage
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (this.config.provider === CloudProvider.FIREBASE) {
        if (!this.config.firebase) {
          throw new StorageError(
            StorageErrorCode.PERMISSION_DENIED,
            'Firebase configuration is required for Firebase provider'
          );
        }

        // Initialize Firebase
        this.firebaseApp = initializeApp(this.config.firebase);
        this.firestore = getFirestore(this.firebaseApp);
        this.auth = getAuth(this.firebaseApp);

        // Authenticate with Firebase
        await this.authenticateWithFirebase();

        // Setup real-time updates
        this.setupRealtimeUpdates();
      }
      
      // Start sync timer if configured
      if (this.config.syncInterval && this.config.syncInterval > 0) {
        this.startSyncTimer();
      }
      
      // Sync on startup if configured
      if (this.config.syncOnStartup) {
        await this.sync();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Cloud storage initialization error:', error);
      this.offlineMode = true;
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        `Failed to initialize cloud storage: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Authenticate with Firebase
   */
  private async authenticateWithFirebase(): Promise<void> {
    if (!this.auth) {
      throw new StorageError(
        StorageErrorCode.PERMISSION_DENIED,
        'Firebase auth is not initialized'
      );
    }

    try {
      // If email and password are provided, use email/password auth
      if (this.config.firebase?.email && this.config.firebase?.password) {
        const result = await signInWithEmailAndPassword(
          this.auth,
          this.config.firebase.email,
          this.config.firebase.password
        );
        this.user = result.user;
      } else {
        // Otherwise use anonymous auth
        const result = await signInAnonymously(this.auth);
        this.user = result.user;
      }
    } catch (error) {
      console.error('Firebase authentication error:', error);
      throw new StorageError(
        StorageErrorCode.PERMISSION_DENIED,
        `Failed to authenticate with Firebase: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Setup real-time updates from Firestore
   */
  private setupRealtimeUpdates(): void {
    if (!this.firestore || !this.user) {
      return;
    }

    const collectionName = this.config.firebase?.collectionName || 'storage';
    const storageCollection = collection(this.firestore, `users/${this.user.uid}/${collectionName}`);
    
    // Subscribe to changes
    this.unsubscribeSnapshot = onSnapshot(storageCollection, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const key = change.doc.id;
        
        // Skip changes that are from pending operations
        const pendingOp = this.pendingOperations.find(op => op.key === key);
        if (pendingOp && pendingOp.timestamp > Date.now() - 5000) {
          return;
        }

        const data = change.doc.data() as SyncItem;
        
        if (change.type === 'added' || change.type === 'modified') {
          if (data.deleted) {
            // Item was deleted on the server
            await this.localProvider.remove(key);
            this.notifyChangeListeners(StorageEvent.ITEM_REMOVED, key);
          } else {
            // Item was added or modified on the server
            await this.localProvider.set(key, data.value);
            this.notifyChangeListeners(StorageEvent.ITEM_UPDATED, key);
          }
        } else if (change.type === 'removed') {
          // Item was deleted on the server
          await this.localProvider.remove(key);
          this.notifyChangeListeners(StorageEvent.ITEM_REMOVED, key);
        }
      });
    }, (error) => {
      console.error('Firestore snapshot error:', error);
    });
  }

  /**
   * Get data by key
   * Delegates to local provider
   * @param key Unique identifier for the stored data
   * @returns Promise resolving to the stored data or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    return this.localProvider.get<T>(key);
  }

  /**
   * Set data by key
   * Sets data locally and queues for sync
   * @param key Unique identifier for the data
   * @param value Data to store
   * @returns Promise resolving when operation completes
   */
  async set<T>(key: string, value: T): Promise<void> {
    await this.localProvider.set(key, value);
    
    // Queue operation for syncing
    this.queueOperation({
      type: 'set',
      key,
      value,
      timestamp: Date.now(),
    });

    // If using optimistic updates, sync immediately
    if (this.config.optimisticUpdates && !this.offlineMode && !this.syncStatus.syncInProgress) {
      this.syncPendingOperations().catch(error => {
        console.error('Failed to sync after set operation:', error);
      });
    }
  }

  /**
   * Remove data by key
   * Removes data locally and queues for sync
   * @param key Unique identifier for the data to remove
   * @returns Promise resolving when operation completes
   */
  async remove(key: string): Promise<void> {
    await this.localProvider.remove(key);
    
    // Queue operation for syncing
    this.queueOperation({
      type: 'remove',
      key,
      timestamp: Date.now(),
    });

    // If using optimistic updates, sync immediately
    if (this.config.optimisticUpdates && !this.offlineMode && !this.syncStatus.syncInProgress) {
      this.syncPendingOperations().catch(error => {
        console.error('Failed to sync after remove operation:', error);
      });
    }
  }

  /**
   * Check if key exists
   * Delegates to local provider
   * @param key Unique identifier to check
   * @returns Promise resolving to boolean indicating if key exists
   */
  async has(key: string): Promise<boolean> {
    return this.localProvider.has(key);
  }

  /**
   * Get all keys
   * Delegates to local provider
   * @returns Promise resolving to array of all keys
   */
  async keys(): Promise<string[]> {
    return this.localProvider.keys();
  }

  /**
   * Clear all stored data
   * Clears local data and queues for sync
   * @returns Promise resolving when operation completes
   */
  async clear(): Promise<void> {
    const keys = await this.localProvider.keys();
    await this.localProvider.clear();
    
    // Queue remove operations for all keys
    keys.forEach(key => {
      this.queueOperation({
        type: 'remove',
        key,
        timestamp: Date.now(),
      });
    });

    // If using optimistic updates, sync immediately
    if (this.config.optimisticUpdates && !this.offlineMode && !this.syncStatus.syncInProgress) {
      this.syncPendingOperations().catch(error => {
        console.error('Failed to sync after clear operation:', error);
      });
    }
  }

  /**
   * Queue an operation for syncing
   * @param operation Operation to queue
   */
  private queueOperation(operation: PendingOperation): void {
    // Check if there's an existing operation for this key
    const existingIndex = this.pendingOperations.findIndex(op => op.key === operation.key);
    
    if (existingIndex !== -1) {
      // If the existing operation is of the same type, replace it
      // If not, decide what to do based on types (e.g., a 'remove' after a 'set' means just remove)
      const existing = this.pendingOperations[existingIndex];
      
      if (existing.type === 'set' && operation.type === 'set') {
        // Replace the set operation with the new value
        this.pendingOperations[existingIndex] = operation;
      } else if (existing.type === 'set' && operation.type === 'remove') {
        // Change the set to a remove
        this.pendingOperations[existingIndex] = operation;
      } else if (existing.type === 'remove' && operation.type === 'set') {
        // Change the remove to a set
        this.pendingOperations[existingIndex] = operation;
      }
      // If both are removes, keep the existing one
    } else {
      // No existing operation, add this one
      this.pendingOperations.push(operation);
    }
  }

  /**
   * Synchronize pending operations with cloud storage
   * @returns Promise resolving when sync completes
   */
  private async syncPendingOperations(): Promise<void> {
    if (this.syncStatus.syncInProgress || this.pendingOperations.length === 0 || this.offlineMode) {
      return;
    }

    try {
      this.updateSyncStatus({ syncInProgress: true, syncError: null });
      
      // Process different providers
      if (this.config.provider === CloudProvider.FIREBASE) {
        await this.syncPendingOperationsToFirebase();
      } else if (this.config.provider === CloudProvider.CUSTOM) {
        await this.syncPendingOperationsToCustomApi();
      }
      
      // Clear pending operations after successful sync
      this.pendingOperations = [];
      
      // Update sync time
      this.updateSyncStatus({
        lastSyncTime: Date.now(),
        syncInProgress: false
      });
    } catch (error) {
      console.error('Cloud sync error:', error);
      this.updateSyncStatus({
        syncInProgress: false,
        syncError: error instanceof Error ? error : new Error(String(error))
      });
      
      throw new StorageError(
        StorageErrorCode.NETWORK_ERROR,
        `Failed to sync with cloud: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Sync pending operations to Firebase
   */
  private async syncPendingOperationsToFirebase(): Promise<void> {
    if (!this.firestore || !this.user) {
      throw new StorageError(
        StorageErrorCode.PERMISSION_DENIED,
        'Firebase is not initialized or user is not authenticated'
      );
    }

    const collectionName = this.config.firebase?.collectionName || 'storage';
    const storageCollection = collection(this.firestore, `users/${this.user.uid}/${collectionName}`);
    
    // Process operations in batches to avoid Firestore limits
    const maxBatchSize = this.config.maxBatchSize || 500;
    let currentBatch = writeBatch(this.firestore);
    let operationsInBatch = 0;
    
    for (const operation of this.pendingOperations) {
      const docRef = doc(storageCollection, operation.key);
      
      if (operation.type === 'set') {
        const syncItem: SyncItem = {
          key: operation.key,
          value: operation.value,
          metadata: {
            createdAt: operation.timestamp,
            updatedAt: operation.timestamp,
            size: JSON.stringify(operation.value).length,
          },
        };
        
        currentBatch.set(docRef, syncItem);
      } else if (operation.type === 'remove') {
        currentBatch.delete(docRef);
      }
      
      operationsInBatch++;
      
      // If we've reached the batch limit, commit and start a new batch
      if (operationsInBatch >= maxBatchSize) {
        await currentBatch.commit();
        currentBatch = writeBatch(this.firestore);
        operationsInBatch = 0;
      }
    }
    
    // Commit any remaining operations
    if (operationsInBatch > 0) {
      await currentBatch.commit();
    }
  }

  /**
   * Sync pending operations to custom API
   */
  private async syncPendingOperationsToCustomApi(): Promise<void> {
    if (!this.config.customApi?.apiEndpoint) {
      throw new StorageError(
        StorageErrorCode.PERMISSION_DENIED,
        'Custom API endpoint is not configured'
      );
    }

    // Prepare batch of operations
    const operations = this.pendingOperations.map(op => ({
      type: op.type,
      key: op.key,
      value: op.type === 'set' ? op.value : null,
      timestamp: op.timestamp,
    }));

    // Send to API
    const response = await fetch(`${this.config.customApi.apiEndpoint}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.customApi.authToken}`,
        ...(this.config.customApi.headers || {}),
      },
      body: JSON.stringify({ operations }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
  }

  /**
   * Synchronize with cloud storage
   * @returns Promise resolving when sync completes
   */
  async sync(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        'Sync already in progress'
      );
    }

    if (this.offlineMode) {
      throw new StorageError(
        StorageErrorCode.NETWORK_ERROR,
        'Cannot sync in offline mode'
      );
    }

    try {
      // Make sure we're initialized
      await this.initialize();
      
      this.updateSyncStatus({ syncInProgress: true, syncError: null });
      
      // First sync pending operations to the cloud
      await this.syncPendingOperations();
      
      // Then pull the latest data from the cloud
      await this.pullFromCloud();
      
      // Update sync time
      this.updateSyncStatus({
        lastSyncTime: Date.now(),
        syncInProgress: false
      });
    } catch (error) {
      console.error('Cloud sync error:', error);
      this.updateSyncStatus({
        syncInProgress: false,
        syncError: error instanceof Error ? error : new Error(String(error))
      });
      
      throw new StorageError(
        StorageErrorCode.NETWORK_ERROR,
        `Failed to sync with cloud: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Push local changes to cloud
   * @returns Promise resolving when push completes
   */
  async push(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        'Sync already in progress'
      );
    }

    if (this.offlineMode) {
      throw new StorageError(
        StorageErrorCode.NETWORK_ERROR,
        'Cannot push in offline mode'
      );
    }

    try {
      // Make sure we're initialized
      await this.initialize();
      
      this.updateSyncStatus({ syncInProgress: true, syncError: null });
      
      // Get all local data
      const keys = await this.localProvider.keys();
      
      // Queue operations for all local data
      for (const key of keys) {
        const value = await this.localProvider.get(key);
        
        if (value !== null) {
          this.queueOperation({
            type: 'set',
            key,
            value,
            timestamp: Date.now(),
          });
        }
      }
      
      // Sync all pending operations
      await this.syncPendingOperations();
      
      // Update sync time
      this.updateSyncStatus({
        lastSyncTime: Date.now(),
        syncInProgress: false
      });
    } catch (error) {
      console.error('Cloud push error:', error);
      this.updateSyncStatus({
        syncInProgress: false,
        syncError: error instanceof Error ? error : new Error(String(error))
      });
      
      throw new StorageError(
        StorageErrorCode.NETWORK_ERROR,
        `Failed to push to cloud: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Pull changes from cloud
   * @returns Promise resolving when pull completes
   */
  async pull(): Promise<void> {
    if (this.syncStatus.syncInProgress) {
      throw new StorageError(
        StorageErrorCode.UNKNOWN_ERROR,
        'Sync already in progress'
      );
    }

    if (this.offlineMode) {
      throw new StorageError(
        StorageErrorCode.NETWORK_ERROR,
        'Cannot pull in offline mode'
      );
    }

    try {
      // Make sure we're initialized
      await this.initialize();
      
      this.updateSyncStatus({ syncInProgress: true, syncError: null });
      
      // Pull the latest data from the cloud
      await this.pullFromCloud();
      
      // Update sync time
      this.updateSyncStatus({
        lastSyncTime: Date.now(),
        syncInProgress: false
      });
    } catch (error) {
      console.error('Cloud pull error:', error);
      this.updateSyncStatus({
        syncInProgress: false,
        syncError: error instanceof Error ? error : new Error(String(error))
      });
      
      throw new StorageError(
        StorageErrorCode.NETWORK_ERROR,
        `Failed to pull from cloud: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Pull data from cloud
   */
  private async pullFromCloud(): Promise<void> {
    if (this.config.provider === CloudProvider.FIREBASE) {
      await this.pullFromFirebase();
    } else if (this.config.provider === CloudProvider.CUSTOM) {
      await this.pullFromCustomApi();
    }
  }

  /**
   * Pull data from Firebase
   */
  private async pullFromFirebase(): Promise<void> {
    if (!this.firestore || !this.user) {
      throw new StorageError(
        StorageErrorCode.PERMISSION_DENIED,
        'Firebase is not initialized or user is not authenticated'
      );
    }

    const collectionName = this.config.firebase?.collectionName || 'storage';
    const storageCollection = collection(this.firestore, `users/${this.user.uid}/${collectionName}`);
    
    // Get all documents from the collection
    const querySnapshot = await getDocs(storageCollection);
    
    // Map of keys to remote data
    const remoteData = new Map<string, DocumentData>();
    
    // Process all documents
    querySnapshot.forEach(doc => {
      remoteData.set(doc.id, doc.data());
    });
    
    // Get all local keys
    const localKeys = await this.localProvider.keys();
    
    // Process local keys that may need updating
    for (const key of localKeys) {
      const remoteItem = remoteData.get(key) as SyncItem | undefined;
      
      // If item doesn't exist remotely or is marked as deleted, remove it locally
      if (!remoteItem || remoteItem.deleted) {
        await this.localProvider.remove(key);
        this.notifyChangeListeners(StorageEvent.ITEM_REMOVED, key);
        continue;
      }
      
      // Get local value to compare
      const localValue = await this.localProvider.get(key);
      
      // If we have a conflict and a resolver, use it
      if (this.config.conflictResolver && 
          JSON.stringify(localValue) !== JSON.stringify(remoteItem.value)) {
        const resolvedValue = this.config.conflictResolver(localValue, remoteItem.value, key);
        await this.localProvider.set(key, resolvedValue);
        this.notifyChangeListeners(StorageEvent.ITEM_UPDATED, key);
      } 
      // Otherwise, if remote value is different from local, update local
      else if (JSON.stringify(localValue) !== JSON.stringify(remoteItem.value)) {
        await this.localProvider.set(key, remoteItem.value);
        this.notifyChangeListeners(StorageEvent.ITEM_UPDATED, key);
      }
      
      // Remove this key from remote data map since we've processed it
      remoteData.delete(key);
    }
    
    // Process remaining remote items (new items not in local storage)
    for (const [key, data] of remoteData.entries()) {
      const item = data as SyncItem;
      
      // Skip deleted items
      if (item.deleted) {
        continue;
      }
      
      // Add to local storage
      await this.localProvider.set(key, item.value);
      this.notifyChangeListeners(StorageEvent.ITEM_ADDED, key);
    }
  }

  /**
   * Pull data from custom API
   */
  private async pullFromCustomApi(): Promise<void> {
    if (!this.config.customApi?.apiEndpoint) {
      throw new StorageError(
        StorageErrorCode.PERMISSION_DENIED,
        'Custom API endpoint is not configured'
      );
    }

    // Send to API
    const response = await fetch(`${this.config.customApi.apiEndpoint}/data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.customApi.authToken}`,
        ...(this.config.customApi.headers || {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    // Parse the response
    const remoteData: Record<string, SyncItem> = await response.json();
    
    // Get all local keys
    const localKeys = await this.localProvider.keys();
    const remoteKeys = Object.keys(remoteData);
    
    // Process all keys
    const allKeys = new Set([...localKeys, ...remoteKeys]);
    
    for (const key of allKeys) {
      const remoteItem = remoteData[key];
      
      // If item doesn't exist remotely or is marked as deleted, remove it locally
      if (!remoteItem || remoteItem.deleted) {
        if (await this.localProvider.has(key)) {
          await this.localProvider.remove(key);
          this.notifyChangeListeners(StorageEvent.ITEM_REMOVED, key);
        }
        continue;
      }
      
      // If item exists locally
      if (await this.localProvider.has(key)) {
        const localValue = await this.localProvider.get(key);
        
        // If we have a conflict and a resolver, use it
        if (this.config.conflictResolver && 
            JSON.stringify(localValue) !== JSON.stringify(remoteItem.value)) {
          const resolvedValue = this.config.conflictResolver(localValue, remoteItem.value, key);
          await this.localProvider.set(key, resolvedValue);
          this.notifyChangeListeners(StorageEvent.ITEM_UPDATED, key);
        } 
        // Otherwise, if remote value is different from local, update local
        else if (JSON.stringify(localValue) !== JSON.stringify(remoteItem.value)) {
          await this.localProvider.set(key, remoteItem.value);
          this.notifyChangeListeners(StorageEvent.ITEM_UPDATED, key);
        }
      } else {
        // Item doesn't exist locally, add it
        await this.localProvider.set(key, remoteItem.value);
        this.notifyChangeListeners(StorageEvent.ITEM_ADDED, key);
      }
    }
  }

  /**
   * Get current sync status
   * @returns Current sync status
   */
  getSyncStatus(): StorageSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Add a sync status listener
   * @param listener Function to call when sync status changes
   * @returns Function to remove the listener
   */
  addSyncListener(listener: (status: StorageSyncStatus) => void): () => void {
    this.syncListeners.push(listener);
    
    // Return a function to remove the listener
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== listener);
    };
  }

  /**
   * Add a storage change listener
   * @param listener Function to call when storage changes
   * @returns Function to remove the listener
   */
  addChangeListener(listener: (event: StorageEvent, key?: string) => void): () => void {
    this.changeListeners.push(listener);
    
    // Return a function to remove the listener
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify storage change listeners
   * @param event Storage event
   * @param key Related key
   */
  private notifyChangeListeners(event: StorageEvent, key?: string): void {
    for (const listener of this.changeListeners) {
      try {
        listener(event, key);
      } catch (error) {
        console.error('Error in storage change listener:', error);
      }
    }
  }

  /**
   * Update sync status and notify listeners
   * @param partial Partial sync status to update
   */
  private updateSyncStatus(partial: Partial<StorageSyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...partial };
    
    // Notify listeners
    for (const listener of this.syncListeners) {
      try {
        listener(this.getSyncStatus());
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    }
  }

  /**
   * Start sync timer
   */
  private startSyncTimer(): void {
    if (this.syncTimer !== null) {
      this.stopSyncTimer();
    }
    
    if (typeof window !== 'undefined' && this.config.syncInterval && this.config.syncInterval > 0) {
      this.syncTimer = window.setInterval(() => {
        this.sync().catch(error => {
          console.error('Scheduled sync failed:', error);
        });
      }, this.config.syncInterval);
    }
  }

  /**
   * Stop sync timer
   */
  private stopSyncTimer(): void {
    if (this.syncTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Update cloud storage configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<CloudStorageConfig>): void {
    const oldConfig = this.config;
    this.config = { ...this.config, ...config };
    
    // Handle sync interval changes
    if (this.config.syncInterval !== oldConfig.syncInterval) {
      if (this.config.syncInterval && this.config.syncInterval > 0) {
        this.startSyncTimer();
      } else {
        this.stopSyncTimer();
      }
    }
    
    // If provider changed, reinitialize
    if (this.config.provider !== oldConfig.provider) {
      this.initialized = false;
      
      // Clean up old provider
      if (this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
        this.unsubscribeSnapshot = null;
      }
      
      // Initialize new provider
      this.initialize().catch(error => {
        console.error('Failed to initialize cloud storage after config update:', error);
        this.offlineMode = true;
      });
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Stop sync timer
    this.stopSyncTimer();
    
    // Unsubscribe from Firestore changes
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
    
    // Sync any pending operations before cleanup
    if (this.pendingOperations.length > 0 && !this.offlineMode) {
      try {
        await this.syncPendingOperations();
      } catch (error) {
        console.error('Failed to sync pending operations during cleanup:', error);
      }
    }
  }
}