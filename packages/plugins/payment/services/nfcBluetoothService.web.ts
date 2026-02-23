/**
 * NFC & Bluetooth Service - Web stub (no NFC/BLE)
 */
export interface NFCCardData {
  cardName: string;
  memberName: string;
  memberId: string;
  balance: number;
  email: string;
  phone: string;
  address: string;
  tagId?: string;
  dec?: string;
  technologies?: string[];
  ndefMessage?: string;
  payloadType?: string;
  isNdefFormatted?: boolean;
}

export interface BluetoothDevice {
  id: string;
  name: string | null;
  rssi: number | null;
}

const noop = async (): Promise<void> => {};
const noopBool = async (): Promise<boolean> => false;
const noopVoid = (): void => {};

const stub = {
  initializeNFC: noop,
  isNFCSupported: noopBool,
  isNFCEnabled: noopBool,
  startNFCListener: noop,
  stopNFCListener: noop,
  readNFCCard: async (): Promise<NFCCardData | null> => null,
  checkNFCHealth: async (): Promise<boolean> => false,
  scanBluetoothDevices: noop,
  stopBluetoothScan: noopVoid,
  connectBluetoothDevice: noop,
  disconnectCurrentBluetoothDevice: noop,
  isBluetoothDeviceConnected: noopBool,
  readNFCCardViaBluetooth: async (): Promise<NFCCardData | null> => null,
  openNFCSettings: noop,
};

export const nfcBluetoothService = stub;
