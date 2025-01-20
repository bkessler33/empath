import ElectronStore from 'electron-store';

export interface StoreSchema {
    emulator: {};  // Empty for now, can add other emulator settings later
}

export const store = new ElectronStore<StoreSchema>({
    defaults: {
        emulator: {}
    }
});